/**
 * @type import('hardhat/config').HardhatUserConfig
 */

 import "@nomiclabs/hardhat-ethers";
 import "@nomiclabs/hardhat-etherscan";
 import "@nomiclabs/hardhat-solhint";
 import "@nomiclabs/hardhat-web3";
 import "@typechain/hardhat";
 import "dotenv/config";
 import "hardhat-deploy";
 import "hardhat-docgen";
 import "solidity-coverage";
 
 import "./tasks/accounts";
 import "./tasks/balance";
 import "./tasks/block-number";
 
 module.exports = {
     defaultNetwork: "hardhat",
     networks: {
         hardhat: {
             // // If you want to do some forking, uncomment this
            //  forking: {
            //    url: "https://cloudflare-eth.com/"
            //  }
         },
         localhost: {},
         ganache: {
             url: "http://localhost:8545"
         },
     },
     namedAccounts: {
         deployer: {
             default: 0, // here this will by default take the first account as deployer
             1: 0, // similarly on mainnet it will take the first account as deployer.
         },
         feeCollector: {
             default: 1,
         },
     },
     solidity: {
         compilers: [
             {
                 version: "0.8.4",
             },
         ],
     },
     mocha: {
         timeout: 100000,
     },
     docgen: {
         path: './docs',
         clear: true,
         runOnCompile: true,
     }
 };
 