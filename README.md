# Solidity-Fundamentals-Test

Hello! If you're reading this, you applied to a Solidity Engineering role at Coinocracy. This is Coinocracy's hiring test for Solidity engineers. (Note: If you have not applied but stumbled across this repository somehow, you are welcome to check out our [job postings](https://angel.co/company/coinocracy/jobs).)

When you fork this repository, you should make your fork **private** and share it with [williamstarkro](https://github.com/williamstarkro) on Github with an admin role. By forking this repository, you agree to keep the MIT License intact and assign the MIT License to your fork as well.

In this repository, we have a very insecure vault located at Vault.sol. It can keep track of balances, handle deposits, and handle withdrawals for **a single user**. It essentially acts as a vault account for a single person and does not support multiple users at the moment. The vault receives a fee from that user for every withdrawal. As you work on Vault.sol, think about:

- What parts of Vault.sol need sanity checks?
- What parts of Vault.sol need to have access control or contain private information?
- What are values for variables in Vault.sol that should never occur?

Your **primary task** is to help secure Vault.sol. Some resources that may help:

- [SafeMath by OpenZeppelin](https://docs.openzeppelin.com/contracts/3.x/api/math)
- [AccessControl by OpenZeppelin](https://docs.openzeppelin.com/contracts/3.x/access-control)
- [Solidity function modifiers](https://docs.soliditylang.org/en/v0.8.4/contracts.html#function-modifiers)
- [Solidity error handling](https://docs.soliditylang.org/en/v0.8.4/control-structures.html?highlight=require#error-handling-assert-require-revert-and-exceptions)

Your **optional secondary task** (which is optional but will stand out significantly if you complete it) is to add a fee calculation to Vault.sol. The vault needs to receive a 0.3% fee on every withdrawal of DAI. This isn't as simple as it sounds! Solidity only supports math on integers. Therefore, you need everything to be in `wei`, which is the smallest unit for Ethereum. As an example, the DAI balance on Etherscan for the address [0xF977814e90dA44bFA03b6295A0616a897441aceC](https://etherscan.io/address/0xF977814e90dA44bFA03b6295A0616a897441aceC) may be $25,039,869 (reported in ether by Etherscan), but its balance in `daiContract.methods.balanceOf(daiWhale).call()` is 25035868999999999999995000 (reported in wei by web3.js). This token division is represented in [decimals](https://docs.openzeppelin.com/contracts/3.x/erc20#a-note-on-decimals), which is a property available in [ERC20.sol](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC20/ERC20.sol#L84). Note that DAI has 18 decimals (the default). For more, take a look at the Solidity docs on [units](https://docs.soliditylang.org/en/v0.8.4/units-and-global-variables.html) and [division](https://docs.soliditylang.org/en/v0.8.4/types.html#division).

If you really want to go **above and beyond with an optional tertiary task**, you can modify Vault.sol to support multiple users. The Vault.sol contract only supports a single user at the moment, but handling deposits and withdrawals for multiple users would stand out significantly and greatly exceed our expectations.

This project is well compensated to give you the time you need to properly secure Vault.sol and work on the optional tasks. The more thorough you are in ensuring the contract's security and completing the optional tasks, the better you'll perform.

### Setup Instructions

1. Install required packages with `yarn install`
2. Run `npm compile` to compile the contracts and create the documentation
3. Run `npm test` to run the tests
4. The initial tests should pass for `depositToVault` and `withdrawFromVault` and fail for `calculateVaultFee`.
