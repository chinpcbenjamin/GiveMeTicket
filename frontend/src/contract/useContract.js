import { ethers } from "ethers";
import {
  TICKETING_PLATFORM_ABI,
  getTicketingPlatformAddress,
  MARKETPLACE_ABI,
  getMarketplaceAddress,
} from "./config";
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
    const addr = await getTicketingPlatformAddress();
    return new ethers.Contract(addr, TICKETING_PLATFORM_ABI, signer);
  };

  const getMarketplaceContract = async () => {
    await ensureCorrectNetwork();
    const signer = await getSigner();
    const addr = await getMarketplaceAddress();
    return new ethers.Contract(addr, MARKETPLACE_ABI, signer);
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

  const listTicketForResale = async (ticketId) => {
    try {
      if (ticketId === undefined || ticketId === null || ticketId === "") {
        throw new Error("Ticket ID is required");
      }

      const ticketing = await getContract();
      const marketplace = await getMarketplaceContract();
      const signer = await getSigner();
      const owner = await signer.getAddress();

      const approvedAddr = await ticketing.getApproved(ticketId);
      const marketplaceAddr = await getMarketplaceAddress();
      const approvedAll = await ticketing.isApprovedForAll(owner, marketplaceAddr);
      if (!approvedAll && approvedAddr.toLowerCase() !== marketplaceAddr.toLowerCase()) {
        const approveTx = await ticketing.approve(marketplaceAddr, ticketId);
        await approveTx.wait();
      }

      const listTx = await marketplace.listTicket(ticketId);
      await listTx.wait();

      return { success: true, txHash: listTx.hash };
    } catch (error) {
      return { success: false, error: formatError(error) };
    }
  };

  return {
    connectWallet,
    getProvider,
    getSigner,
    getContract,
    getMarketplaceContract,
    ensureCorrectNetwork,
    listTicketForResale,
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

export async function listTicketForResale(ticketId) {
  const { listTicketForResale: list } = useContract();
  return await list(ticketId);
}

export async function getMarketplaceContract() {
  const { getMarketplaceContract: gmc } = useContract();
  return await gmc();
}
