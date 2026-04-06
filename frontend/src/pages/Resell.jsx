import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getContract, connectWallet, listTicketForResale } from "../contract/useContract";
import { ethers } from "ethers";

export default function Resell() {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [resellPrice, setResellPrice] = useState(0);

  async function checkOwnership() {
    const contract = await getContract();
    const currentUser = await connectWallet();
    const ticket_owner = await contract.ownerOf(ticketId);
    if (ticket_owner.toLowerCase() !== currentUser.toLowerCase()) {
      alert("You do not own this ticket!");
      navigate("/my-tickets");
      return false;
    }
    return true;
  }

  async function getTicket() {
    const contract = await getContract();
    const ticketRaw = await contract.tickets(ticketId);
    const eventRaw = await contract.events(ticketRaw[0]);
    const cap = await contract.getResaleCap(ticketId);
    const t = {
      ticketId: ticketId,
      eventId: ticketRaw[0],
      eventName: eventRaw[0],
      facePrice: ethers.formatEther(ticketRaw[1]),
      currentResaleCap: ethers.formatEther(cap),
      status: ["Valid", "Used", "Resale", "Cancelled"][Number(ticketRaw[2])],
      resaleCommissionBps: Number(eventRaw[7]) / 100,
    };
    if (t.status !== "Valid") {
      alert("Ticket is not valid!");
      navigate("/my-tickets");
      return;
    }
    if (["Active", "Ended", "Cancelled"][Number(eventRaw[6])] !== "Active") {
      alert("Event is not active!");
      navigate("/my-tickets");
      return;
    }

    setTicket(t);
  }

  useEffect(() => {
    (async () => {
      const isOwner = await checkOwnership();
      if (!isOwner) return;
      await getTicket();
    })();
  }, [ticketId]);

  async function handleResell() {
    const contract = await getContract();
    const maxPrice = await contract.getResaleCap(ticketId);

    if (ethers.parseEther(resellPrice) > maxPrice) {
      alert("Resale price is too high!");
      return;
    }

    try {
      const result = await listTicketForResale(ticketId, resellPrice);
      if (!result.success) {
        alert(result.error);
        return;
      }
      alert("Ticket listed for resale!");
      navigate("/my-tickets");
    } catch (error) {
      console.error(error);
      alert("Failed to list ticket for resale");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex justify-center items-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-b border-slate-700/50 p-8">
            <p className="text-xs uppercase tracking-widest text-amber-400 mb-2">Resale Listing</p>
            <h1 className="text-3xl text-white font-extrabold">Resell Ticket</h1>
            <p className="text-slate-400 mt-1">List your ticket on the marketplace</p>
          </div>

          {ticket && (
          <div className="p-8 space-y-6">
            <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-700/30 space-y-3">
              <h2 className="text-xl font-bold text-white mb-3">{ticket.eventName}</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Ticket ID</p>
                  <p className="text-lg font-semibold text-slate-300">#{ticket.ticketId}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Status</p>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400">{ticket.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Original Price</p>
                  <p className="text-lg font-semibold text-white">{ticket.facePrice} <span className="text-sm text-slate-400">ETH</span></p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Max Resale Price</p>
                  <p className="text-lg font-semibold text-amber-400">{ticket.currentResaleCap} <span className="text-sm text-amber-600">ETH</span></p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Commission Fee</p>
                <p className="text-lg font-semibold text-slate-300">{ticket.resaleCommissionBps}%</p>
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-700/30">
              <label className="block text-xs uppercase tracking-widest text-slate-500 mb-3">Set Resale Price</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={resellPrice}
                  onChange={(e) => setResellPrice(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700/50 text-white placeholder-slate-500 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition"
                  placeholder="Enter resale price"
                />
                <span className="text-lg font-bold text-slate-400">ETH</span>
              </div>
            </div>

            <button
              className="w-full py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-900/40 transition-all duration-200 cursor-pointer"
              onClick={handleResell}
            >
              List for Resale
            </button>

            <button
              onClick={() => navigate("/my-tickets")}
              className="w-full py-3 rounded-xl font-semibold text-slate-400 bg-slate-800/40 border border-slate-700/50 hover:text-white hover:bg-slate-700/40 transition-all duration-200 cursor-pointer"
            >
              Back to My Tickets
            </button>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
