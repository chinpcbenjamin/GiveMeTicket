const hre = require("hardhat");

async function main() {
  const TicketingPlatform = await hre.ethers.getContractFactory("TicketingPlatform");

  const contract = await TicketingPlatform.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("Contract deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});