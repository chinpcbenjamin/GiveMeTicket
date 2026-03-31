import { ethers } from "ethers";
import { CONTRACT_ADDRESS, ABI } from "./config";

export async function getContract() {
  if (!window.ethereum) throw new Error("No wallet found");
  const provider = new ethers.BrowserProvider(window.ethereum);
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
}