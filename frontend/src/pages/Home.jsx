import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { connectWallet, getContract } from "../contract/useContract";


export default function Home() {
    const navigate = useNavigate();

    const [account, setAccount] = useState(null);

    async function handleConnectWallet() {
        try {
        const connected = await connectWallet();
        setAccount(connected);
        console.log("Connected wallet:", connected);
        } catch (err) {
        console.error("Failed to connect wallet:", err);
        }
    }

    async function createDefaultEvent() {
        if (!account) {
        alert("Please connect your wallet first!");
        return;
        }

        try {
        const contract = await getContract();
        const tx = await contract.createEvent(
            "Blockchain Music Fest 2026",
            Math.floor(Date.now() / 1000) + 86400,
            100,
            ethers.parseEther("5"),
            12000
        );

        console.log("Transaction sent! Waiting for confirmation...");
        const receipt = await tx.wait();
        console.log("Event created!", receipt);
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div className="min-h-screen min-w-sc bg-white flex flex-col items-center py-20 px-4">
            <h1 className="text-5xl font-extrabold tracking-tight mb-16">
                GiveMeTicket
            </h1>

            <div className="flex flex-col gap-6 items-center">
                {account && (
                    <div
                        className="bg-black hover:bg-gray-800 transition cursor-pointer rounded-2xl p-10 w-192 text-center"
                    >
                        <p className="text-xl text-white font-bold">Connected Wallet: {account}</p>
                    </div>
                )}


                {account && (
                    <div
                        className="bg-green-400 hover:bg-gray-800 transition cursor-pointer rounded-2xl p-10 w-64 text-center"
                        onClick={() => navigate("/my-tickets")}
                    >
                        <p className="text-xl text-white font-bold">My Tickets</p>
                    </div>
                )}
                {account && (
                    <div 
                        className="bg-blue-400 hover:bg-blue-600 transition cursor-pointer rounded-2xl p-10 w-56 flex items-center justify-center"
                        onClick={() => navigate("/buy")}
                    >
                        <p className="text-xl text-white font-bold">Buy Official Tickets</p>
                    </div>
                )}
                {account && (
                    <div 
                        className="bg-blue-400 hover:bg-blue-600 transition cursor-pointer rounded-2xl p-10 w-56 flex items-center justify-center"
                        onClick={() => navigate("/marketplace")}
                    >
                        <p className="text-xl text-white font-bold">Buy Resale Tickets</p>
                    </div>
                )}

                {!account && (
                    <button
                        className="bg-yellow-400 hover:bg-yellow-500 text-white transition rounded-2xl p-6 w-56 font-bold"
                        onClick={handleConnectWallet}
                    >
                    Connect Wallet
                    </button>
                )}

                <div 
                    className="bg-red-600 hover:bg-red-400 transition cursor-pointer rounded-2xl p-10 w-56 flex items-center justify-center"
                    onClick={createDefaultEvent}
                >
                    <p className="text-xl text-white font-bold">Setup Demo</p>
                </div>
            </div>
        </div>
    )
}