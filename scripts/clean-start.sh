#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== Cleaning Hardhat cache & artifacts ==="
rm -rf cache artifacts

echo "=== Cleaning deployed-addresses.json ==="
rm -f frontend/public/contract/deployed-addresses.json
rm -f frontend/src/contract/deployed-addresses.json

echo "=== Compiling smart contracts ==="
npx hardhat compile

echo ""
echo "=== Starting Hardhat node (background) ==="
npx hardhat node &
NODE_PID=$!

cleanup() {
  echo ""
  echo "=== Shutting down Hardhat node (PID $NODE_PID) ==="
  kill "$NODE_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 3

echo ""
echo "=== Deploying contracts ==="
npx hardhat run scripts/deploy.js --network localhost

echo ""
echo "============================================"
echo "  Clean start complete!"
echo "  Hardhat node running (PID $NODE_PID)"
echo ""
echo "  IMPORTANT: In MetaMask, reset each account:"
echo "    Settings > Advanced > Clear activity tab data"
echo "============================================"
echo ""

wait "$NODE_PID"
