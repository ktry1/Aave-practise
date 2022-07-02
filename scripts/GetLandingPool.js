const {ethers} = require("hardhat");
const {lendingPoolAddressProviderAddress} = require("../constants");
require("dotenv").config();
const DEPLOYER_KEY = process.env.DEPLOYER_KEY;
const provider = ethers.getDefaultProvider("http://127.0.0.1:8545/");
const signer = new ethers.Wallet(DEPLOYER_KEY,provider);

async function getlendingPool(){
    const lendingPoolAddressProvider = await ethers.getContractAt("ILendingPoolAddressesProvider",lendingPoolAddressProviderAddress);
    const lendingPoolAddress = await lendingPoolAddressProvider.getLendingPool();
    console.log(`LendingPool address is ${lendingPoolAddress}`);
    console.log("Getting the LendingPool contract...");
    const lendingPool = await ethers.getContractAt("ILendingPool",lendingPoolAddress,signer);
    console.log("Got the LandingPool contract!");
    console.log("------------------------------------------------");
    return lendingPool
}


module.exports = {
    getlendingPool,
    signer,
    provider
}