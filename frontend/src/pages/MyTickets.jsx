// need to modify this to take the current userid's tickets from smart contract itself
// instead of the const myTickets
// do not need multiple event tickets for now. just one event ticket

// can just use userid = 1 since we do not connect to any wallet yet

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getContract, getMarketplaceContract, connectWallet } from "../contract/useContract";
import { MARKETPLACE_ADDRESS } from "../contract/config";
import { ethers } from "ethers";

export default function MyTickets() {
  const navigate = useNavigate();
  const [myTickets, setMyTickets] = useState([]);

  async function fetchTickets() {
      const contract = await getContract();
      const marketplace = await getMarketplaceContract();
      const currentUser = (await connectWallet()).toLowerCase();
      const marketplaceLower = MARKETPLACE_ADDRESS.toLowerCase();

      const nextTokenId = Number(await contract.nextTokenId());
      const myTicketsList = [];

      for (let i = 0; i < nextTokenId; i++) {
        const owner = (await contract.ownerOf(i)).toLowerCase();

        let isMine = owner === currentUser;

        if (!isMine && owner === marketplaceLower) {
          const listing = await marketplace.resaleListings(i);
          isMine = listing.seller.toLowerCase() === currentUser;
        }

        if (!isMine) continue;

        const ticketRaw = await contract.tickets(i);
        const eventRaw = await contract.events(ticketRaw[0]);
        const ticket = {
            ticketId: i,
            eventId: ticketRaw[0],
            eventName: eventRaw[0],
            facePrice: ethers.formatEther(ticketRaw[1]),
            status: ["Valid", "Used", "Resale", "Cancelled"][Number(ticketRaw[2])],
        };
        myTicketsList.push(ticket);
      }
      setMyTickets(myTicketsList);
  }

  useEffect(() => {
    fetchTickets();
  }, []);

  async function handleCancelResale(ticketId) {
    try {
      const marketplace = await getMarketplaceContract();
      const tx = await marketplace.cancelListing(ticketId);
      await tx.wait();
      await fetchTickets();
    } catch (err) {
      console.error(err);
      alert("Failed to cancel resale");
    }
  }

  const statusStyles = {
    Valid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Used: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Resale: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Cancelled: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Your Collection</p>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            My Tickets
          </h1>
          <p className="text-slate-400 mt-2">View and manage all tickets in your wallet</p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {myTickets.map((ticket) => (
            <div
              key={ticket.ticketId}
              className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden hover:border-slate-600/50 transition-all duration-200 group"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <h2 className="text-xl font-bold text-white group-hover:text-violet-300 transition-colors">
                    {ticket.eventName}
                  </h2>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusStyles[ticket.status] || statusStyles.Cancelled}`}>
                    {ticket.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/60 rounded-lg p-3">
                    <p className="text-xs uppercase tracking-widest text-slate-500 mb-0.5">Ticket ID</p>
                    <p className="font-semibold text-slate-300 font-mono">#{ticket.ticketId}</p>
                  </div>
                  <div className="bg-slate-900/60 rounded-lg p-3">
                    <p className="text-xs uppercase tracking-widest text-slate-500 mb-0.5">Price</p>
                    <p className="font-semibold text-white">{ticket.facePrice} <span className="text-xs text-slate-400">ETH</span></p>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  {ticket.status === "Valid" && (
                    <button
                      className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-900/30 transition-all duration-200 cursor-pointer text-sm"
                      onClick={() => navigate(`/resell/${ticket.ticketId}`)}
                    >
                      Resell
                    </button>
                  )}
                  {ticket.status === "Resale" && (
                    <button
                      onClick={() => handleCancelResale(ticket.ticketId)}
                      className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-lg shadow-rose-900/30 transition-all duration-200 cursor-pointer text-sm"
                    >
                      Cancel Resale
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {myTickets.length === 0 && (
          <div className="text-center py-24">
            <div className="inline-block bg-slate-800/60 border border-slate-700/50 rounded-2xl px-12 py-10">
              <p className="text-2xl font-bold text-slate-400 mb-2">No tickets found</p>
              <p className="text-slate-500">Purchase tickets from events or the marketplace</p>
              <button
                onClick={() => navigate("/events")}
                className="mt-6 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-900/30 transition-all duration-200 cursor-pointer"
              >
                Browse Events
              </button>
            </div>
          </div>
        )}

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
