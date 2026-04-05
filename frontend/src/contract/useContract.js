import { ethers } from "ethers";
import { ABI as CONTRACT_ABI, CONTRACT_ADDRESS } from "./config";
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

  const formatError = (error) => {
    if (!error) return "Unknown error";

    if (error.code === 4001 || error.code === "ACTION_REJECTED") {
      return "Transaction rejected by user";
    }

    if (error.code === "UNPREDICTABLE_GAS_LIMIT" && error.info?.error?.message) {
      return error.info.error.message;
    }

    if (error.data?.message) return error.data.message;
    if (error.reason) return error.reason;
    if (error.shortMessage) return error.shortMessage;

    return error.message || String(error);
  };

  const resellTicket = async (ticketId, price) => {
    try {
      const contract = await getContract();

      if (ticketId === undefined || ticketId === null || ticketId === "") {
        throw new Error("Ticket ID is required");
      }

      if (price === undefined || price === null || price === "") {
        throw new Error("Price is required");
      }

      let priceInWei;
      if (typeof price === "bigint") {
        priceInWei = price;
      } else {
        const normalizedPrice = price.toString();
        priceInWei = ethers.parseEther(normalizedPrice);
      }

      const tx = await contract.resellTicket(ticketId, priceInWei);
      await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
      };
    } catch (error) {
      return {
        success: false,
        error: formatError(error),
      };
    }
  };

  return {
    connectWallet,
    getProvider,
    getSigner,
    getContract,
    ensureCorrectNetwork,
    resellTicket,
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

export async function resellTicket(ticketId, price) {
  const { resellTicket: rt } = useContract();
  return await rt(ticketId, price);
}
