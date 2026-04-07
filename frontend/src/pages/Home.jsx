import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { connectWallet } from "../contract/useContract";


export default function Home() {
    const navigate = useNavigate();

    const [account, setAccount] = useState(null);

    async function handleConnectWallet() {
        try {
        const connected = await connectWallet();
        setAccount(connected);
        localStorage.setItem("connectedAccount", connected);
        console.log("Connected wallet:", connected);
        } catch (err) {
        console.error("Failed to connect wallet:", err);
        }
    }

    // restore connected account if previously connected
    useEffect(() => {
        const saved = localStorage.getItem("connectedAccount");
        if (saved) setAccount(saved);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center px-4 py-16">
            <div className="text-center mb-14">
                <h1 className="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
                    GiveMeTicket
                </h1>
                <p className="mt-3 text-slate-400 text-lg">Decentralized event ticketing on the blockchain</p>
            </div>

            {account && (
                <div className="mb-8 w-full max-w-xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl px-6 py-4 text-center">
                    <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Connected Wallet</p>
                    <p className="text-sm text-slate-300 font-mono truncate">{account}</p>
                </div>
            )}

            <div className="flex flex-col gap-4 items-center w-full max-w-xs">
                {account && (
                    <button
                        className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-900/30 transition-all duration-200 cursor-pointer"
                        onClick={() => navigate("/my-tickets")}
                    >
                        My Tickets
                    </button>
                )}

                {account && (
                    <button
                        className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-900/30 transition-all duration-200 cursor-pointer"
                        onClick={() => navigate("/events")}
                    >
                        Buy Official Tickets
                    </button>
                )}

                {account && (
                    <button
                        className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-lg shadow-indigo-900/30 transition-all duration-200 cursor-pointer"
                        onClick={() => navigate("/marketplace")}
                    >
                        Buy Resale Tickets
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

                <button
                    className="w-full py-4 rounded-xl font-semibold text-slate-300 bg-slate-800/60 border border-slate-700/50 hover:bg-slate-700/60 hover:text-white transition-all duration-200 cursor-pointer mt-2"
                    onClick={() => navigate("/admin")}
                >
                    Admin Panel
                </button>
            </div>
        </div>
    )
}
