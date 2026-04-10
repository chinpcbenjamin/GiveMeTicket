const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const TicketingPlatform = await hre.ethers.getContractFactory("TicketingPlatform");
  const ticketing = await TicketingPlatform.deploy();
  await ticketing.waitForDeployment();
  const ticketingAddress = await ticketing.getAddress();

  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(ticketingAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();

  // TicketingPlatform.owner() is deployer; only owner can register the marketplace.
  const setTx = await ticketing.setMarketplace(marketplaceAddress);
  await setTx.wait();

  const addresses = {
    deployer: deployer.address,
    ticketingPlatform: ticketingAddress,
    marketplace: marketplaceAddress,
  };

  // write to frontend public so the dev server can fetch the latest file at runtime
  const outPath = path.join(__dirname, "..", "frontend", "public", "contract", "deployed-addresses.json");
  // ensure directory exists
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));

  const outPath2 = path.join(__dirname, "..", "frontend", "src", "contract", "deployed-addresses.json");
  fs.mkdirSync(path.dirname(outPath2), { recursive: true });
  fs.writeFileSync(outPath2, JSON.stringify(addresses, null, 2));

  console.log("Deployer:", deployer.address);
  console.log("TicketingPlatform:", ticketingAddress);
  console.log("Marketplace:", marketplaceAddress);
  console.log("Bound: TicketingPlatform.marketplace() ->", await ticketing.marketplace());
  console.log("Addresses written to:", outPath, "and", outPath2);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});