import { Signer } from "ethers";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Vault, Vault__factory } from "../typechain";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    let accounts: Signer[];

    accounts = await hre.ethers.getSigners();

    const tokenFactory = await hre.ethers.getContractFactory('SimpleToken', accounts[0]);
    const token = await tokenFactory.deploy();
    await token.deployed();

    const vaultFactory = await hre.ethers.getContractFactory('Vault', accounts[0]);
    const vault = await vaultFactory.deploy();
    await vault.deployed();
    
    console.log(
        `The address the Contract WILL have once mined: ${vault.address}`
    );

    console.log(
        `The transaction that was sent to the network to deploy the Contract: ${vault.deployTransaction.hash}`
    );

    console.log(
        "The contract is NOT deployed yet; we must wait until it is mined..."
    );

    await vault.deployed();

    console.log("Minted...");
};
export default func;
func.id = "deploy";
func.tags = ["local"];