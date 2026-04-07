const fs = require('fs');
const path = require('path');
const hre = require('hardhat');

async function main() {
  const jsonPath = path.join(__dirname, '..', 'frontend', 'public', 'contract', 'deployed-addresses.json');
  const addresses = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const ticketingAddr = addresses.ticketingPlatform;
  if (!ticketingAddr) throw new Error('ticketingPlatform missing in deployed-addresses.json');

  const TicketingPlatform = await hre.ethers.getContractFactory('TicketingPlatform');
  const ticketing = TicketingPlatform.attach(ticketingAddr);

  const [owner] = await hre.ethers.getSigners();
  const ownerFromContract = await ticketing.owner();

  const provider = hre.ethers.provider;
  const contractBal = await provider.getBalance(ticketingAddr);
  const ownerBal = await provider.getBalance(ownerFromContract);

  console.log('ticketingPlatform:', ticketingAddr);
  console.log('contract balance:', hre.ethers.formatEther(contractBal), 'ETH');
  console.log('owner (from contract):', ownerFromContract);
  console.log('owner balance:', hre.ethers.formatEther(ownerBal), 'ETH');
  console.log('default signer[0]:', owner.address);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
