const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

const ADDRESSES_PATH = path.join(__dirname, "..", "frontend", "public", "contract", "deployed-addresses.json");
const ARTIFACT_PATH = path.join(__dirname, "..", "artifacts", "contracts", "TicketingPlatform.sol", "TicketingPlatform.json");

async function main() {
  const addresses = JSON.parse(fs.readFileSync(ADDRESSES_PATH, "utf8"));
  const CONTRACT_ADDRESS = addresses.ticketingPlatform;

  const artifact = require(ARTIFACT_PATH);
  const ABI = artifact.abi;

  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

  try {
    const total = await contract.totalSupply();
    console.log("totalSupply:", total.toString());
  } catch (err) {
    console.error("call failed:", err);
    process.exitCode = 1;
  }
}

main();
