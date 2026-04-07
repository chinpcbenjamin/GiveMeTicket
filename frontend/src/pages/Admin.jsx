import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { connectWallet, getContract, getProvider } from "../contract/useContract";
import { TICKETING_PLATFORM_ADDRESS } from "../contract/config";


export default function Admin() {
    const navigate = useNavigate();

    const [account, setAccount] = useState(null);
    const [contractBalance, setContractBalance] = useState(null);

    async function fetchBalance() {
        try {
            const provider = await getProvider();
            const balance = await provider.getBalance(TICKETING_PLATFORM_ADDRESS);
            setContractBalance(ethers.formatEther(balance));
        } catch (err) {
            console.error("Failed to fetch balance:", err);
        }
    }

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [eventName, setEventName] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [totalSupply, setTotalSupply] = useState("");
    const [facePrice, setFacePrice] = useState("");
    const [resaleCapBps, setResaleCapBps] = useState("");
    const [resaleCommissionBps, setResaleCommissionBps] = useState("");

    async function handleConnectWallet() {
        try {
            const connected = await connectWallet();
            setAccount(connected);
            await fetchBalance();
        } catch (err) {
            console.error("Failed to connect wallet:", err);
        }
    }

    async function getOwnerAddress() {
        try {
            const contract = await getContract();
            const owner = await contract.owner()
            console.log("Owner:", owner)
        } catch (err) {
            console.error(err)
        }
    }

    async function withdrawMoney() {
        try {
            const contract = await getContract();
            const tx = await contract.withdraw();
            await tx.wait();
            await fetchBalance();
        } catch (err) {
            alert("You are not the owner!");
            console.error(err);
        }
    }

    async function createEvent() {
        try {
            const contract = await getContract();
            const tx = await contract.createEvent(
                eventName, 
                Math.floor(new Date(eventDate).getTime() / 1000),
                totalSupply,
                ethers.parseEther(facePrice),
                resaleCapBps * 100,
                resaleCommissionBps * 100
            );

            console.log("Transaction sent! Waiting for confirmation...");
            const receipt = await tx.wait();
            console.log("Event created!", receipt);
            return true
        } catch (err) {
            console.error(err);
        }
    }

    const handleCreateEvent = async() => {
        const ok = await createEvent()
        if (ok) {
            alert("Event created successfully!");
            navigate("/events")
        } else {
            alert("You are not the owner!")
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center px-4 py-16">
            <div className="w-full flex justify-start mb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold text-slate-300 bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/40 transition"
                >
                    ← Back
                </button>
            </div>

            <div className="text-center mb-8">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Administration</p>
                <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-rose-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
                    Admin Panel
                </h1>
            </div>

            <div className="w-full max-w-lg flex flex-col gap-4 items-center">
                {account && (
                    <div className="w-full bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl px-6 py-4 text-center">
                        <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Connected Wallet</p>
                        <p className="text-sm text-slate-300 font-mono truncate">{account}</p>
                    </div>
                )}

                {account && contractBalance !== null && (
                    <div className="w-full bg-slate-800/60 backdrop-blur-sm border border-emerald-700/30 rounded-2xl px-6 py-4 text-center">
                        <p className="text-xs uppercase tracking-widest text-emerald-500 mb-1">Contract Balance</p>
                        <p className="text-2xl text-emerald-400 font-bold">{contractBalance} <span className="text-sm text-emerald-600">ETH</span></p>
                    </div>
                )}

                {account && (
                    <button
                        className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 shadow-lg shadow-pink-900/30 transition-all duration-200 cursor-pointer"
                        onClick={() => getOwnerAddress()}
                    >
                        Get Owner Address (Debug)
                    </button>
                )}

                {account && (
                    <button
                        className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-900/30 transition-all duration-200 cursor-pointer"
                        onClick={() => withdrawMoney()}
                    >
                        Withdraw Funds
                    </button>
                )}

                {account && (
                    <button
                        className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-900/30 transition-all duration-200 cursor-pointer"
                        onClick={() => setShowCreateModal(true)}
                    >
                        Create Event
                    </button>
                )}

                {!account && (
                    <button
                        className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-900/30 transition-all duration-200 cursor-pointer text-lg"
                        onClick={handleConnectWallet}
                    >
                        Connect Wallet
                    </button>
                )}

                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-8 w-full max-w-lg flex flex-col gap-5 shadow-2xl">
                            
                            <h2 className="text-2xl font-bold text-white text-center">Create Event</h2>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs uppercase tracking-widest text-slate-500">Event Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Blockchain Summit 2026"
                                    className="bg-slate-800 border border-slate-700/50 text-white placeholder-slate-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs uppercase tracking-widest text-slate-500">Event Date</label>
                                <input
                                    type="datetime-local"
                                    className="bg-slate-800 border border-slate-700/50 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs uppercase tracking-widest text-slate-500">Total Supply</label>
                                <input
                                    type="number"
                                    placeholder="Number of tickets"
                                    className="bg-slate-800 border border-slate-700/50 text-white placeholder-slate-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition"
                                    value={totalSupply}
                                    onChange={(e) => setTotalSupply(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs uppercase tracking-widest text-slate-500">Face Price (ETH)</label>
                                <input
                                    type="number"
                                    placeholder="0.05"
                                    className="bg-slate-800 border border-slate-700/50 text-white placeholder-slate-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition"
                                    value={facePrice}
                                    onChange={(e) => setFacePrice(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs uppercase tracking-widest text-slate-500">Resale Cap (%)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 120 for max 20% markup"
                                    className="bg-slate-800 border border-slate-700/50 text-white placeholder-slate-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition"
                                    value={resaleCapBps}
                                    onChange={(e) => setResaleCapBps(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-xs uppercase tracking-widest text-slate-500">Resale Commission (%)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 10 for 10% fee"
                                    className="bg-slate-800 border border-slate-700/50 text-white placeholder-slate-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition"
                                    value={resaleCommissionBps}
                                    onChange={(e) => setResaleCommissionBps(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-3 mt-2">
                                <button
                                    className="flex-1 py-3 rounded-xl font-semibold text-slate-300 bg-slate-800 border border-slate-700/50 hover:bg-slate-700 transition-all duration-200 cursor-pointer"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-900/30 transition-all duration-200 cursor-pointer"
                                    onClick={() => handleCreateEvent()}
                                >
                                    Create Event
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
