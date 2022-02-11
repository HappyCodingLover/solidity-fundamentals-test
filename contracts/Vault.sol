// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title A sample vault contract
/// @author William Starr & Coinocracy Inc.
/// @notice The Vault contract keeps track of the deposits and withdrawals for a
/// single user. The vault takes a 0.3% fee on every withdrawal. The vault contract
/// supports deposits and withdrawals for any ERC-20, but only one ERC-20 token
/// can be used per vault contract.
/// @dev Security for the Vault contract is paramount :) You can assume that the
/// owner of the Vault contract is the first account in Ganache (accounts[0]
/// within Vault.ts), and that the user of the vault is not the owner of the Vault
/// contract (e.g. the user of the vault is accounts[1] within Vault.ts, not
/// accounts[0]).
contract Vault is Ownable {
    // The contract address for USD token
    address public ERC20_ADDRESS;
    address public VAULT_FEE_ADDRESS;


    // using safemath for protecting overflow
    using SafeMath for uint256;

    uint256 balance = 0;

    // The vault should take a fee of 0.3% on every withdrawal. For example, if a
    // user is withdrawing 1000 USD, the vault should receive 3 USD. If a user is
    // withdrawing 100 USD, the vault should receive .3 USD.
    // The vaultFee is set using setVaultFee();
    uint256 vaultFee = 0;

    // address passed in is not the zero address.
    modifier onlyValidAddress(address _addr) {
        require(_addr != address(0), "Not valid address");
        _;
    }

    // make sure uint256 is not out of range
    modifier onlyValidUint(uint256 _val) {
        require(_val < 2**128 - 1, "Value is out of range");
        _;
    }

    /// @notice Set the address for the USD token the vault will use
    /// @param _token The address of the token contract
    function setERCAddress(address _token) public onlyOwner onlyValidAddress(_token) {
        ERC20_ADDRESS = _token;
    }

    /// @notice Set the address for the fee address the vault will use
    /// @param _address The address of the fee receiver
    function setVaultFeeAddress(address _address) public onlyOwner onlyValidAddress(_address) {
        VAULT_FEE_ADDRESS = _address;
    }

    /// @notice Process a deposit to the vault
    /// @param amount The amount that a user wants to deposit
    /// @return balance The current account balance
    function deposit(uint256 amount) public onlyOwner returns (uint256) {
        // Initialize the ERC20 for USDC or DAI
        IERC20 erc20 = IERC20(ERC20_ADDRESS);

        // Transfer funds from the user to the vault
        erc20.transferFrom(msg.sender, address(this), amount);

        // Increase the balance by the deposit amount and return the balance
        // balance += amount;
        balance = balance.add(amount);
        return balance;
    }

    /// @notice Process a withdrawal from the vault
    /// @param amount The amount that a user wants to withdraw. The vault takes a
    /// 0.3% fee on every withdrawal
    /// @return balance The current account balance
    function withdraw(uint256 amount) public onlyOwner returns (uint256) {
        // Initialize the ERC20 for USDC or DAI
        IERC20 erc20 = IERC20(ERC20_ADDRESS);

        // Calculate the fee that is owed to the vault
        (uint256 amountToUser, uint256 amountToVault) = calculateVaultFee(amount);
        erc20.transfer(msg.sender, amountToUser);
        // Decrease the balance by the amount sent to the user
        // balance -= amountToUser;
        balance = balance.sub(amountToUser);

        erc20.transfer(VAULT_FEE_ADDRESS, amountToVault);
        // Decrease the balance by the amount sent to the vault
        // balance -= amountToVault;
        balance = balance.sub(amountToVault);

        return balance;
    }

    /// @notice Calculate the fee that should go to the vault
    /// @param amount The amount that a fee should be deducted from
    /// @return A tuple of (amountToUser, amountToVault)
    function calculateVaultFee(uint256 amount)
        public
        view
        returns (uint256, uint256)
    {
        // TODO: Implement the 0.3% fee to the vault here
        uint256 amountToVault = amount * vaultFee;
        // uint256 amountToUser = amount - amountToVault;
        uint256 amountToUser = amount.sub(amountToVault);
        return (amountToUser, amountToVault);
    }

    /// @notice Set the fee that the vault takes
    /// @param fee The fee that vaultFee should be set to
    /// @return vaultFee The new value of the vault fee
    function setVaultFee(uint256 fee) public onlyOwner onlyValidUint(fee) returns (uint256) {
        vaultFee = fee;
        return vaultFee;
    }

    /// @notice Get the user's vault balance
    /// @return balance The balance of the user
    function getBalanceForVaultUser() public view returns (uint256) {
        return balance;
    }
}
