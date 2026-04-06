import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getContract } from "../contract/useContract";
import { useNavigate } from "react-router-dom";

export default function Events() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);

    async function getAllEvents() {
        const contract = await getContract();
        const nextId = Number(await contract.nextEventId());
        const allEvents = [];

        for (let i = 0; i < nextId; i++) {
            const evtRaw = await contract.events(i);

            const evt = {
                eventId: i,
                name: evtRaw[0],
                date: Number(evtRaw[1]),
                totalSupply: Number(evtRaw[2]),
                ticketsSold: Number(evtRaw[3]),
                facePrice: ethers.formatEther(evtRaw[4]),
                resaleCapBps: Number(evtRaw[5]),
                status: ["Active", "Ended", "Cancelled"][Number(evtRaw[6])],
                resaleCommissionBps: Number(evtRaw[7]),
            };

            allEvents.push(evt);
        }

        console.log("All parsed events:", allEvents);
        return allEvents;
    }

    useEffect(() => {
        (async () => {
        const evts = await getAllEvents();
        setEvents(evts);
        })();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-16">
            <div className="max-w-6xl mx-auto">
                <div className="mb-10">
                    <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Official Sales</p>
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        Available Events
                    </h1>
                    <p className="text-slate-400 mt-2">Browse and purchase tickets for upcoming events</p>
                </div>

                <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-slate-700/50">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                                        ID
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                                        Event
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                                        Available
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                                        Price
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                                        Status
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/30">
                                {events.map((listing) => (
                                <tr key={listing.eventId} className="hover:bg-slate-700/20 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">
                                        #{listing.eventId}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                                        {listing.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                        {listing.totalSupply - listing.ticketsSold} <span className="text-slate-500">/ {listing.totalSupply}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                                        {listing.facePrice} <span className="text-slate-400 font-normal">ETH</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                                            listing.status === "Active"
                                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                                : listing.status === "Ended"
                                                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                                : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                                        }`}>
                                            {listing.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        {(listing.status !== "Active" || listing.totalSupply - listing.ticketsSold === 0) && (
                                            <span className="text-slate-500 font-medium">Unavailable</span>
                                        )}
                                        {listing.status === "Active" && listing.totalSupply - listing.ticketsSold > 0 && (
                                            <button
                                                className="px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-900/30 transition-all duration-200 cursor-pointer text-sm"
                                                onClick={() => navigate(`/buy/${listing.eventId}`)}>
                                                Buy Ticket
                                            </button>
                                        )}
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {events.length === 0 && (
                        <div className="text-center py-16">
                            <p className="text-lg text-slate-500">No events available yet</p>
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    <button
                        onClick={() => navigate("/")}
                        className="py-3 px-6 rounded-xl font-semibold text-slate-400 bg-slate-800/40 border border-slate-700/50 hover:text-white hover:bg-slate-700/40 transition-all duration-200 cursor-pointer"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}
