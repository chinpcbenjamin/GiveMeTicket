# GiveMeTicket

## Quick Start (Clean Slate)

The fastest way to get a fully clean environment — ideal for testing and live demos.

1. From root, `npm install` (first time only)
2. `cd frontend && npm install && cd ..` (first time only)
3. `npm start` — cleans all caches, compiles, starts node, and deploys contracts
4. In a new terminal: `cd frontend && npm run dev`
5. **Reset MetaMask** (see below)

## Manual Setup

### Backend
1. From root, `npm install`
2. `npx hardhat compile`

### Local Blockchain
1. `npx hardhat node` — keep this terminal running

### Deploy Contracts
1. Open a new terminal from root
2. `npx hardhat run scripts/deploy.js --network localhost`

### Frontend
1. `cd frontend && npm install`
2. `npm run dev`

## MetaMask Setup

### First-Time Network Setup
1. Add custom network:
   * RPC URL: `http://127.0.0.1:8545`
   * Chain ID: `31337`
2. Import a test account using a private key from Hardhat node logs

### Reset MetaMask (Do This Every Restart)
After restarting the Hardhat node, MetaMask caches stale nonces and transaction history from the previous session. You **must** clear it:
1. Open MetaMask
2. Click the account icon > **Settings**
3. Go to **Advanced**
4. Click **Clear activity tab data**
5. Repeat for each imported account you use

> Without this step you will see phantom/stale data and transactions may fail silently.

## Available npm Scripts (root)

| Script | Description |
|--------|-------------|
| `npm start` | Full clean start: wipes caches, compiles, starts node, deploys contracts |
| `npm run clean` | Remove Hardhat cache, artifacts, and deployed-addresses files |
| `npm run compile` | Compile smart contracts |
| `npm run node` | Start Hardhat local blockchain |
| `npm run deploy` | Deploy contracts to running local node |

## Notes
* `npm start` is the recommended way to launch for testing/demos
* Restarting the node resets all contracts and accounts
* Contract addresses are auto-populated in `deployed-addresses.json` on deploy
* Always reset MetaMask activity after restarting the node