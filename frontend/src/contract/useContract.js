import { ethers } from "ethers";
import TicketingPlatformArtifact from "../../../artifacts/contracts/TicketingPlatform.sol/TicketingPlatform.json";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // we need to edit this
const CONTRACT_ABI = TicketingPlatformArtifact.abi;
const HARDHAT_CHAIN_ID = "0x7a69"; // 31337 in hex

export const useContract = () => {
  const checkEthereum = () => {
    if (!window || !window.ethereum) {
      throw new Error("MetaMask not found");
    }
    return window.ethereum;
  };

  let walletPromise = null;

  const connectWallet = async () => {
    const ethereum = checkEthereum();

    if (!walletPromise) {
      walletPromise = ethereum.request({ method: "eth_requestAccounts" })
        .finally(() => {
          walletPromise = null;
        });
    }

    const accounts = await walletPromise;
    return accounts[0];
  };

  const getProvider = async () => {
    checkEthereum();
    return new ethers.BrowserProvider(window.ethereum);
  };

  const getSigner = async () => {
    const provider = await getProvider();
    return await provider.getSigner();
  };

  const ensureCorrectNetwork = async () => {
    const ethereum = checkEthereum();
    const chainId = await ethereum.request({ method: "eth_chainId" });

    if (chainId !== HARDHAT_CHAIN_ID) {
      throw new Error("Please switch MetaMask to Hardhat Local (Chain ID 31337)");
    }
  };

  const getContract = async () => {
    await ensureCorrectNetwork();
    const signer = await getSigner();

    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  };

  return {
    connectWallet,
    getProvider,
    getSigner,
    getContract,
    ensureCorrectNetwork,
  };
};

// Backwards-compatible named exports for existing code that imports { getContract }
export async function getContract() {
  const { getContract: gc } = useContract();
  return await gc();
}

export async function getProvider() {
  const { getProvider: gp } = useContract();
  return await gp();
}

export async function getSigner() {
  const { getSigner: gs } = useContract();
  return await gs();
}

export async function connectWallet() {
  const { connectWallet: cw } = useContract();
  return await cw();
}

export async function ensureCorrectNetwork() {
  const { ensureCorrectNetwork: ecn } = useContract();
  return await ecn();
}