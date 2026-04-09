import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getContract, getProvider } from "../contract/useContract";
import { getTicketingPlatformAddress } from "../contract/config";
import { useAccount } from "../contract/AccountContext.jsx";


export default function Admin() {
    const navigate = useNavigate();

    const { account, connectWallet } = useAccount();
    const [contractBalance, setContractBalance] = useState(null);
    const [ownerAddressState, setOwnerAddressState] = useState(null);
    const [ownerWalletBalance, setOwnerWalletBalance] = useState(null);
    const [events, setEvents] = useState([]);

    async function fetchEvents() {
        try {
            const contract = await getContract();
            const nextId = Number(await contract.nextEventId());
            const list = [];
            for (let i = 0; i < nextId; i++) {
                const e = await contract.events(i);
                list.push({
                    eventId: i,
                    name: e[0],
                    status: ["Active", "Ended", "Cancelled"][Number(e[6])],
                });
            }
            setEvents(list);
        } catch (err) {
            console.error("Failed to fetch events:", err);
        }
    }

    async function fetchBalance() {
        try {
            const provider = await getProvider();
            const addr = await getTicketingPlatformAddress();
            const balance = await provider.getBalance(addr);
            setContractBalance(ethers.formatEther(balance));
        } catch (err) {
            console.error("Failed to fetch balance:", err);
        }
    }

    async function fetchOwner() {
        try {
            const contract = await getContract();
            const owner = await contract.owner();
            setOwnerAddressState(owner);
            const provider = await getProvider();
            const ownerBal = await provider.getBalance(owner);
            setOwnerWalletBalance(ethers.formatEther(ownerBal));
        } catch (err) {
            console.warn('Failed to fetch owner:', err);
        }
    }

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [eventName, setEventName] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [totalSupply, setTotalSupply] = useState("");
    const [facePrice, setFacePrice] = useState("");
    const [resaleCapBps, setResaleCapBps] = useState("");
    const [resaleCommissionBps, setResaleCommissionBps] = useState("");

    const [gateTicketId, setGateTicketId] = useState("");
    const [gateStatus, setGateStatus] = useState(null); // null | "valid" | "invalid" | "used" | "error"
    const [gateMessage, setGateMessage] = useState("");

    async function withdrawMoney() {
        try {
            const contract = await getContract();
            const tx = await contract.withdraw();
            await tx.wait();
            await fetchBalance();
            await fetchOwner();
        } catch (err) {
            // surface detailed revert reason when possible
            const reason = err?.reason || err?.data?.message || err?.message || String(err);
            alert(`Withdraw failed: ${reason}`);
            console.error('Withdraw failed:', err);
        }
    }

    async function createEvent() {
        try {
            // validate inputs
            if (Number(resaleCommissionBps) >= 100) {
                alert("Resale commission must be less than 100% — seller should receive part of resale proceeds.");
                return false;
            }

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
            const reason = err?.reason || err?.data?.message || err?.message || String(err);
            alert(`Failed to create event: ${reason}`);
            console.error(err);
            return false;
        }
    }

    const handleCreateEvent = async() => {
        const ok = await createEvent();
        if (ok) {
            alert("Event created successfully!");
            navigate("/events");
        }
    };

    async function handleCancelEvent(eventId) {
        try {
            const contract = await getContract();
            const tx = await contract.cancelEvent(eventId);
            await tx.wait();
            await fetchEvents();
        } catch (err) {
            const reason = err?.reason || err?.data?.message || err?.message || String(err);
            alert(`Cancel failed: ${reason}`);
        }
    }

    async function handleCheckTicket() {
        setGateStatus(null);
        setGateMessage("");
        try {
            const contract = await getContract();
            try {
                await contract.ownerOf(Number(gateTicketId));
            } catch {
                setGateStatus("error");
                setGateMessage("Ticket does not exist");
                return;
            }
            const ticketRaw = await contract.tickets(Number(gateTicketId));
            const statusLabel = ["Valid", "Used", "Resale", "Cancelled"][Number(ticketRaw[2])];
            const eventRaw = await contract.events(ticketRaw[0]);
            const eventName = eventRaw[0];
            if (statusLabel === "Valid") {
                setGateStatus("valid");
                setGateMessage(`Ticket #${gateTicketId} — ${eventName} — Valid`);
            } else {
                setGateStatus("invalid");
                setGateMessage(`Ticket #${gateTicketId} — ${eventName} — ${statusLabel}`);
            }
        } catch (err) {
            setGateStatus("error");
            setGateMessage("Ticket not found or error fetching status");
        }
    }

    async function handleMarkTicketUsed() {
        try {
            const contract = await getContract();
            const tx = await contract.markTicketUsed(Number(gateTicketId));
            await tx.wait();
            setGateStatus("used");
            setGateMessage(`Ticket #${gateTicketId} marked as Used on-chain`);
        } catch (err) {
            const reason = err?.reason || err?.data?.message || err?.message || String(err);
            setGateStatus("error");
            setGateMessage(`Failed: ${reason}`);
        }
    }

    async function handleMarkEnded(eventId) {
        try {
            const contract = await getContract();
            const tx = await contract.markEventEnded(eventId);
            await tx.wait();
            await fetchEvents();
        } catch (err) {
            const reason = err?.reason || err?.data?.message || err?.message || String(err);
            alert(`Mark ended failed: ${reason}`);
        }
    }

    useEffect(() => {
        if (!account) return;
        fetchBalance();
        fetchOwner();
        fetchEvents();
    }, [account]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center px-4 py-16">
            <div className="w-full flex justify-start mb-4">
                <button
                    onClick={() => navigate("/")}
                    className="inline-flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold text-slate-300 bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/40 transition"
                >
                    ← Home
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

                {ownerAddressState && (
                    <div className="w-full bg-slate-800/60 backdrop-blur-sm border border-emerald-700/30 rounded-2xl px-6 py-4 text-center">
                        <p className="text-xs uppercase tracking-widest text-emerald-500 mb-1">Contract Owner</p>
                        <p className="text-sm text-emerald-300 font-mono truncate">{ownerAddressState}</p>
                    </div>
                )}

                {account && contractBalance !== null && (
                    <div className="w-full bg-slate-800/60 backdrop-blur-sm border border-emerald-700/30 rounded-2xl px-6 py-4 text-center">
                        <p className="text-xs uppercase tracking-widest text-emerald-500 mb-1">Contract Balance</p>
                        <p className="text-2xl text-emerald-400 font-bold">{contractBalance} <span className="text-sm text-emerald-600">ETH</span></p>
                    </div>
                )}

                {ownerAddressState && ownerWalletBalance !== null && (
                    <div className="w-full bg-slate-800/60 backdrop-blur-sm border border-blue-700/30 rounded-2xl px-6 py-4 text-center">
                        <p className="text-xs uppercase tracking-widest text-blue-400 mb-1">Owner Wallet Balance</p>
                        <p className="text-2xl text-blue-300 font-bold">{ownerWalletBalance} <span className="text-sm text-blue-500">ETH</span></p>
                    </div>
                )}

                {account && (
                    <button
                        className={`w-full py-4 rounded-xl font-semibold text-white ${ownerAddressState && account && ownerAddressState.toLowerCase() === account.toLowerCase() ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-900/30' : 'bg-slate-700/40 cursor-not-allowed opacity-60'}`}
                        onClick={() => withdrawMoney()}
                        disabled={!(ownerAddressState && account && ownerAddressState.toLowerCase() === account.toLowerCase())}
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
                        onClick={connectWallet}
                    >
                        Connect Wallet
                    </button>
                )}

                {account && (
                    <div className="w-full mt-2">
                        <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Ticket Gate</p>
                        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 flex flex-col gap-4">
                            <p className="text-sm text-slate-400">Enter a ticket ID to verify and mark as used at the venue gate.</p>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Ticket ID"
                                    value={gateTicketId}
                                    onChange={(e) => { setGateTicketId(e.target.value); setGateStatus(null); setGateMessage(""); }}
                                    className="flex-1 bg-slate-900 border border-slate-700/50 text-white placeholder-slate-500 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition text-sm"
                                />
                                <button
                                    onClick={handleCheckTicket}
                                    disabled={gateTicketId === ""}
                                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-slate-700 hover:bg-slate-600 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Check
                                </button>
                            </div>
                            {gateMessage && (
                                <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
                                    gateStatus === "valid"   ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" :
                                    gateStatus === "used"    ? "bg-blue-500/15 text-blue-300 border border-blue-500/30" :
                                    gateStatus === "invalid" ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" :
                                                               "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                }`}>
                                    {gateMessage}
                                </div>
                            )}
                            {gateStatus === "valid" && (
                                <button
                                    onClick={handleMarkTicketUsed}
                                    className="w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-900/30 transition-all duration-200 cursor-pointer"
                                >
                                    Mark Ticket #{gateTicketId} as Used
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {events.length > 0 && (
                    <div className="w-full mt-2">
                        <p className="text-xs uppercase tracking-widest text-slate-500 mb-3">Manage Events</p>
                        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-slate-700/50">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Status</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/30">
                                    {events.map((evt) => (
                                        <tr key={evt.eventId} className="hover:bg-slate-700/20 transition-colors">
                                            <td className="px-4 py-3 text-sm text-slate-400 font-mono">#{evt.eventId}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-white">{evt.name}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${
                                                    evt.status === "Active" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                                    : evt.status === "Ended" ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                                    : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                                                }`}>{evt.status}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {evt.status === "Active" && (
                                                    <div className="inline-flex gap-2">
                                                        <button
                                                            onClick={() => handleMarkEnded(evt.eventId)}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 transition-all duration-200 cursor-pointer"
                                                        >
                                                            Mark Ended
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancelEvent(evt.eventId)}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 transition-all duration-200 cursor-pointer"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                )}
                                                {evt.status !== "Active" && (
                                                    <span className="text-xs text-slate-500">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
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
