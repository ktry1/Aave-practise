const { ethers } = require("hardhat");
const {getlendingPool, signer, provider} = require("./GetLandingPool");
const AMOUNT = ethers.utils.parseEther("0.1");
let lendingPool;

async function main() {
    lendingPool = await getlendingPool();
    const wEthbalance = await getWeth(signer.address, AMOUNT);
    await depositAsset("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",wEthbalance,signer.address);
    let [totalCollateralETH, availableBorrowsETH] = await getUserAccountData(signer.address);
    const tokenstoBorrowAmount = await getAssetBorrowData(availableBorrowsETH,"0x773616e4d11a78f511299002da57a0a94577f1f4","DAI");
    await borrowAsset("0x6B175474E89094C44Da98b954EedeAC495271d0F",ethers.utils.parseEther(tokenstoBorrowAmount.toString()),1,0,signer.address,"DAI");
    let [,,totalDebtETH] = await getUserAccountData(signer.address);
    await repayDebt("0x6B175474E89094C44Da98b954EedeAC495271d0F",totalDebtETH,1,signer.address,"0x773616e4d11a78f511299002da57a0a94577f1f4");
    await getUserAccountData(signer.address);
  }
  

async function getWeth(onBehalfOf, amount){
    console.log("Establishing connection with wETH contract...");
    const wEthContract = await ethers.getContractAt("IWeth", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", signer);
    console.log("Connection established!");
    console.log(`Depositing ${ethers.utils.formatEther(amount)} ETH to wETH token contract...`);
    const tx = await wEthContract.deposit({value:amount.toString()});
    const txReceipt = await tx.wait(1);
    console.log("Deposit successful!");
    const wEthBalance = await wEthContract.balanceOf(onBehalfOf);
    console.log(`wETH balance is ${ethers.utils.formatEther(wEthBalance)}`);
    console.log("------------------------------------------------");
    await grantAllowance(wEthContract,lendingPool.address, wEthBalance, "wETH");
    return wEthBalance
}

async function grantAllowance(tokenContract,onBehalfOf,amount,tokenName){
    console.log(`Granting access to ${ethers.utils.formatEther(amount)} ${tokenName} for LendingPool ${onBehalfOf}...`);
    const tx = await tokenContract.approve(onBehalfOf, amount);
    const txReceipt = await tx.wait(1);
    console.log("Approval Granted!");
    console.log("------------------------------------------------");
    return amount;
}

async function depositAsset(tokenAddress,amount,onBehalfOf){
    console.log(`Depositing ${ethers.utils.formatEther(amount)} wETH into lendingPool...`);
    const tx = await lendingPool.deposit(tokenAddress, amount, onBehalfOf, 0); 
    const txReceipt = await tx.wait(1);
    console.log("Deposit successful!");
}


async function getUserAccountData(onBehalfOf){
    const [totalCollateralETH,totalDebtETH,availableBorrowsETH,,,,] = await lendingPool.getUserAccountData(onBehalfOf);
    console.log(`Total collateral is ${ethers.utils.formatEther(totalCollateralETH)} ETH`);
    console.log(`Total debt is ${ethers.utils.formatEther(totalDebtETH)} ETH`);
    console.log(`Available borrow amount is ${ethers.utils.formatEther(availableBorrowsETH)} ETH`);
    console.log("------------------------------------------------");
    return [totalCollateralETH, availableBorrowsETH, totalDebtETH]
}

async function getAssetBorrowData(totalBorrowEth,aggregatorAddress,tokenName){
  const priceAggregator = await ethers.getContractAt("AggregatorV3Interface",aggregatorAddress);
  const tokenEthPrice = (await priceAggregator.latestRoundData())[1]; 
  console.log(`${tokenName} price is ${ethers.utils.formatEther(tokenEthPrice)} ETH`);
  const tokensToBorrowAmount = totalBorrowEth.toString() * 0.95 * (1 / tokenEthPrice.toNumber());
  console.log(`You can borrow ${tokensToBorrowAmount} ${tokenName}`); 
  console.log("------------------------------------------------");
  return tokensToBorrowAmount;
}

async function borrowAsset(tokenAddress, amount, interestRateMode, referralCode,  onBehalfOf, tokenName){
    console.log(`Borrowing ${ethers.utils.formatEther(amount)} ${tokenName}...`);
    tx = await lendingPool.borrow(tokenAddress,amount,interestRateMode,referralCode,onBehalfOf);
    txReceipt = await tx.wait(1);
    console.log("Borrow successful!");
    console.log("------------------------------------------------");
}

async function repayDebt(tokenAddress, amountInEth, rateMode, onBehalfOf, aggregatorAddress){
  console.log("Getting the priceFeed...");
  const priceAggregator = await ethers.getContractAt("AggregatorV3Interface",aggregatorAddress);
  const tokenEthPrice = (await priceAggregator.latestRoundData())[1]; 
  const tokenToRepay = amountInEth.toString() * 0.95 * (1 / tokenEthPrice.toNumber());
  const payAmount = ethers.utils.parseUnits(tokenToRepay.toString());
  console.log("Price acquired, requesting approval..");
  const daiContract = await ethers.getContractAt("IERC20",tokenAddress,signer);
  await grantAllowance(daiContract,lendingPool.address, payAmount, "DAI");
  console.log("Approval obtained, proceeding with payment...");
  const tx = await lendingPool.repay(tokenAddress,payAmount, rateMode, onBehalfOf);
  const txReceipt = await tx.wait(1);
  console.log("Debt partially repaid! Need to implement uniswap to complete pay it off.");
  console.log("------------------------------------------------");
}



  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });