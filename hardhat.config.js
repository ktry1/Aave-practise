/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("dotenv").config();
require("hardhat-deploy");
require("@nomiclabs/hardhat-ethers");


const ALCHEMY_FORK_API_URL = process.env.ALCHEMY_FORK_API_URL;
module.exports = {
  solidity:{
    compilers: [
      {
        version: "0.6.12"
      }, 
      {
        version:"0.8.7"
      },
      {
        version: "0.4.19"
      }
    ]
  },
  networks: {
    hardhat: {
      forking: {
        url: ALCHEMY_FORK_API_URL,
        enabled: true,
      }
    }
  },
  namedAccounts: {
    deployer: {
        default: 0, // here this will by default take the first account as deployer
    },
}
}
