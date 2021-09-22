import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import assert from 'assert';
import { deployments, ethers, getUnnamedAccounts, web3 } from "hardhat";
import { Vault, Vault__factory } from '../typechain';
import { SimpleToken, SimpleToken__factory } from '../typechain';

const { BN, ether, balance } = require('@openzeppelin/test-helpers');

var decimalPlaces = 18;

const vaultFeeAddress = "0xcD0Bf0039d0F09CF93f9a05fB57C2328F6D525A3";

// This function sends ETH to an address. This is only used to pay gas fees, you
// probably won't need this.
// Based on https://github.com/ryanio/truffle-mint-dai/blob/master/test/dai.js
async function sendEth(fromAccount: string, toAccount: string, amount: string) {
  await web3.eth.sendTransaction({
    from: fromAccount,
    to: toAccount,
    value: amount,
  });

  const ethBalance = await balance.current(toAccount);
  assert.notEqual(
    ethBalance.toString(),
    0,
    "ethBalance should not be 0 after sending ETH",
  );

  return ethBalance;
}

async function sendDai(tokenContract: SimpleToken, fromAccount: string, toAccount: string, amount: number) {
  let signer = await ethers.getSigner(fromAccount);
  await tokenContract.connect(signer)
    // Ether requires a string or a BN to avoid precision issues, and .transfer also requires a string
    .transfer(toAccount, amount.toString());
  const daiBalance = await tokenContract.balanceOf(toAccount);
  console.log("Dai balance", daiBalance.toString());
  assert.notEqual(
    daiBalance.toString(),
    "0",
    "daiBalance should not be 0 after sending DAI",
  );

  return daiBalance;
}

async function setupDai(tokenInstance: SimpleToken, usdOwner: string, account: string, vaultAddress: string, amountDai: number) {
  var amount = ethers.utils.parseUnits('10000000.0', decimalPlaces);
  let signer = await ethers.getSigner(usdOwner);
  await tokenInstance.initialize([usdOwner], [amount]);
  // Initialize daiWhale with ETH
  sendEth(account, usdOwner, ether(String(1)).toString());
  // Send Dai in units of ether
  amountDai = ether(amountDai.toString()).toString();
  const oldDaiBalance = await tokenInstance.balanceOf(account);
  const sendDaiResult = await sendDai(tokenInstance, usdOwner, account, amountDai);
  // Double check DAI balance (since this is a test after all)
  const newDaiBalance = await tokenInstance.balanceOf(account);
  // Subtract the daiBalance so this doesn't fail on multiple runs
  let changedDaiBalance = newDaiBalance.toBigInt() - oldDaiBalance.toBigInt();

  assert.equal(
    sendDaiResult.toString(),
    newDaiBalance.toString(),
    `sendDaiResult was ${sendDaiResult} newDaiBalance from contract was ${newDaiBalance}`,
  );

  assert.equal(
    changedDaiBalance.toString(),
    amountDai.toString(),
    `changedDaiBalance was ${changedDaiBalance} amountDai was ${amountDai}`,
  );
  assert.notEqual(
    0,
    newDaiBalance,
    "Account newDaiBalance after sending from Dai whale should not be 0",
  );

  let accountSigner = await ethers.getSigner(account);
  await tokenInstance.connect(accountSigner)
    .approve(vaultAddress, amountDai);

  // Check the approval amount
  const daiAllowance = await tokenInstance
    .allowance(account.toString(), vaultAddress);

  assert.equal(
    daiAllowance.toString(),
    amountDai.toString(),
    `daiAllowance was ${daiAllowance} while approval was for ${amountDai}`,
  );

  console.log("daiAllowance is " + daiAllowance);
}

// Tests begin here
describe("Vault", function () {
  let accounts: any;
  let vaultInstance: any;
  let tokenInstance: any;


  before("setup", async () => {
    const vaultFactory = await ethers.getContractFactory("Vault") as Vault__factory;
    vaultInstance = await vaultFactory.deploy() as Vault;
    const tokenFactory = await ethers.getContractFactory("SimpleToken") as SimpleToken__factory;
    tokenInstance = await tokenFactory.deploy() as SimpleToken;
    await vaultInstance.setERCAddress(tokenInstance.address);
    accounts = await getUnnamedAccounts();
    await vaultInstance.setVaultFeeAddress(accounts[8]);
  });

  after("clean up", async () => {
    vaultInstance = null;
    tokenInstance = null;
  });


  it('depositToVault', async () => {
    const usdOwner = accounts[0];
    const vaultOwner = accounts[1];
    const vaultUser = accounts[2];
    // Fund the vaultUser with some DAI (since it is initialized without any)
    await setupDai(tokenInstance, usdOwner, vaultUser, vaultInstance.address, 1000);
    let bal = await tokenInstance.balanceOf(vaultUser);
    expect(bal >= ether('1000'));

    // Deposit 1000 DAI in Ether
    let amountToDeposit = ether(String(1000)).toString();

    let vaultBalanceBeforeDeposit = await vaultInstance.getBalanceForVaultUser();
    let vaultUserDaiBalanceBeforeDeposit = await tokenInstance.balanceOf(vaultUser);
    console.log(`vaultBalanceBeforeDeposit: ${vaultBalanceBeforeDeposit} vaultUserDaiBalanceBeforeDeposit: ${vaultUserDaiBalanceBeforeDeposit}`);

    // Call the deposit function within vaultInstance
    let userSigner = await ethers.getSigner(vaultUser);
    await vaultInstance.connect(userSigner)
      .deposit(amountToDeposit);

    let vaultBalanceAfterDeposit = await vaultInstance.getBalanceForVaultUser();
    let vaultUserDaiBalanceAfterDeposit = await tokenInstance.balanceOf(vaultUser);
    console.log(`vaultBalanceAfterDeposit: ${vaultBalanceAfterDeposit} vaultUserDaiBalanceAfterDeposit: ${vaultUserDaiBalanceAfterDeposit} amountToDeposit: ${amountToDeposit}`);

    // Check both the DAI balances and the vault balances to ensure that the vault
    // properly received the DAI
    expect(vaultBalanceAfterDeposit === vaultBalanceBeforeDeposit.add(BigNumber.from(amountToDeposit)));
    expect(vaultUserDaiBalanceAfterDeposit === vaultUserDaiBalanceBeforeDeposit.sub(BigNumber.from(amountToDeposit)));
  });

  it('withdrawFromVault', async () => {
    const vaultOwner = accounts[0];
    const vaultUser = accounts[1];
    // TODO: The vault should take a fee of 0.3% on every withdrawal
    let fee = 0;

    let vaultOwnerSigner = await ethers.getSigner(vaultOwner);
    await vaultInstance.connect(vaultOwnerSigner).setVaultFee(fee);

    // Withdraw 1000 DAI in Ether
    let amountToWithdraw = ether(String(1000)).toString();

    let vaultBalanceBeforeWithdrawal = await vaultInstance.getBalanceForVaultUser();
    let vaultUserDaiBalanceBeforeWithdrawal = await tokenInstance.balanceOf(vaultUser);
    let vaultFeeBalanceBeforeWithdrawal = await tokenInstance.balanceOf(vaultFeeAddress);
    console.log(`vaultBalanceBeforeWithdrawal: ${vaultBalanceBeforeWithdrawal} vaultUserDaiBalanceBeforeWithdrawal: ${vaultUserDaiBalanceBeforeWithdrawal} vaultFeeBalanceBeforeWithdrawal: ${vaultFeeBalanceBeforeWithdrawal}`);

    // Call the withdraw function within vaultInstance
    let vaultUserSigner = await ethers.getSigner(vaultUser);
    await vaultInstance.connect(vaultUserSigner).withdraw(amountToWithdraw);


    let vaultBalanceAfterWithdrawal = await vaultInstance.getBalanceForVaultUser();
    let vaultUserDaiBalanceAfterWithdrawal = await tokenInstance.balanceOf(vaultUser);
    let vaultFeeBalanceAfterWithdrawal = await tokenInstance.balanceOf(vaultFeeAddress);
    console.log(`vaultBalanceAfterWithdrawal: ${vaultBalanceAfterWithdrawal} vaultUserDaiBalanceAfterWithdrawal: ${vaultUserDaiBalanceAfterWithdrawal} vaultFeeBalanceAfterWithdrawal: ${vaultFeeBalanceAfterWithdrawal} amountToWithdraw:${`amountToWithdraw`}`);

    // Check both the DAI balances and the vault balances to ensure that the user 
    // and the vault fee address properly received the DAI
    expect(vaultBalanceAfterWithdrawal).to.be.to.equal(vaultBalanceBeforeWithdrawal.sub(BigNumber.from(amountToWithdraw)));
    // TODO: This test needs to be fixed using the same methods as the fee calculation, since BN.js does not support decimals
    // expect(vaultUserDaiBalanceAfterWithdrawal).to.be.to.equal(vaultUserDaiBalanceBeforeWithdrawal.add(amountToWithdraw.muln(.997)));
    // expect(vaultFeeBalanceAfterWithdrawal).to.be.to.equal(vaultFeeBalanceBeforeWithdrawal.add(amountToWithdraw.muln(.003)));
  });

  it('calculateVaultFee', async () => {
    const vaultOwner = accounts[0];
    const vaultUser = accounts[1];
    // If you try to use destructing on the tuple, it will fail with "TypeError: (intermediate value) is not iterable"
    // For example, this will not work:
    // let [amountToUser, amountToVault] = await vaultInstance.calculateVaultFee.call(String(1000), String(0));
    // Instead, you need to access the object directly (yes, this took forever to figure out): https://github.com/sidorares/node-mysql2/issues/782#issuecomment-445460063
    // For reference, if you need to access the contents of vaultFee or any other returned object, you can use:
    // const util = require('util');
    // let vaultFee = await vaultInstance.calculateVaultFee.call(String(1000));
    // console.log(util.inspect(vaultFee, { depth: null }))

    let vaultFee = await vaultInstance.calculateVaultFee(String(1000));
    expect(vaultFee[0]).to.be.to.equal(BigNumber.from(997));
    expect(vaultFee[1]).to.be.to.equal(BigNumber.from(3));

    vaultFee = await vaultInstance.calculateVaultFee.call(String(1000000000000000000000));
    expect(vaultFee[0]).to.be.to.equal(BigNumber.from(997000000000000000000));
    expect(vaultFee[1]).to.be.to.equal(BigNumber.from(3000000000000000000));

  });
});