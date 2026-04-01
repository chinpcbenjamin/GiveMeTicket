import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { getContract } from "../contract/useContract";

export default function Events() {
    const [events, setEvents] = useState([]);

    async function getAllEvents() {
        const contract = await getContract();
        const nextId = Number(await contract.nextEventId());
        const allEvents = [];

        for (let i = 0; i < nextId; i++) {
            const evtRaw = await contract.events(i);

            const evt = {
                id: i,
                name: evtRaw[0],
                date: Number(evtRaw[1]),
                totalSupply: Number(evtRaw[2]),
                ticketsSold: Number(evtRaw[3]),
                facePrice: ethers.formatEther(evtRaw[4]),
                resaleCapBps: Number(evtRaw[5]),
                status: ["Active", "Ended", "Cancelled"][Number(evtRaw[6])],
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
        <div className="min-h-screen bg-gray-100 flex justify-center items-center px-6 py-10">
        <div className="w-full max-w-6xl bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="bg-black text-white p-8">
            <h1 className="text-4xl font-extrabold mb-2">Available Events</h1>
            <p className="text-gray-300">
                Browse the available events.
            </p>
            </div>

            <div className="p-8">
            <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-gray-50">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Event ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Tickets Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Price (ETH)
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Action
                    </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {events.map((listing) => (
                    <tr key={listing.id}>
                        <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-900">
                        #{listing.id}
                        </td>
                        <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-900">
                        {listing.name}
                        </td>
                        <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-900">
                        {listing.totalSupply - listing.ticketsSold}
                        </td>
                        <td className="px-6 py-4 text-left whitespace-nowrap text-sm font-semibold text-gray-900">
                        {listing.facePrice}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {
                            (listing.status !== "Active" || listing.totalSupply - listing.ticketsSold === 0) && (
                                <td className="px-6 py-4 text-left whitespace-nowrap text-sm font-semibold text-gray-900">
                                Unavailable
                                </td>
                            )
                        }
                        {
                            listing.status === "Active" && listing.totalSupply - listing.ticketsSold > 0 && (
                                <button className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition">
                                    Buy
                                </button>
                            )
                        }
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            </div>
        </div>
        </div>
    );
}