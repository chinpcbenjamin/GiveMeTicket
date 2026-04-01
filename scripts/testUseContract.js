const { ethers } = require("ethers");
const path = require("path");

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const ARTIFACT_PATH = path.join(__dirname, "..", "artifacts", "contracts", "TicketingPlatform.sol", "TicketingPlatform.json");

async function main() {
  const artifact = require(ARTIFACT_PATH);
  const ABI = artifact.abi;

  // Connect to local Hardhat node
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // Use provider as runner for read-only calls
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
