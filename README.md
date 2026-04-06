# GiveMeTicket

Backend Dev Setup

1. From root, stay in project directory
2. `npm install` to install dependencies
3. `npx hardhat compile` to compile smart contracts

Local Blockchain

1. Run `npx hardhat node` to start local blockchain
2. Keep this terminal running

Deploy Contract

1. Open a new terminal (from root)
2. Run `npx hardhat run scripts/deploy.js --network localhost`
3. Copy the deployed contract address from output

Frontend Dev Setup
1. From root, `cd frontend`
2. `npm install` to install node modules
3. `npm run dev` to dev deploy

MetaMask Setup

1. Add custom network:

   * RPC URL: `http://127.0.0.1:8545`
   * Chain ID: `31337`
2. Import a test account using private key from Hardhat node logs

Notes

* Restarting the node resets all contracts and accounts
* You must redeploy after restarting
* Use the latest contract address and ABI for frontend integration
