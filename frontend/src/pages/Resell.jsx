import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getContract, listTicketForResale, getMarketplaceContract } from "../contract/useContract";
import { useAccount } from "../contract/AccountContext.jsx";
import { ethers } from "ethers";

export default function Resell() {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const { account, connectWallet } = useAccount();

  async function checkOwnership() {
    const contract = await getContract();
    try {
      let currentUser = account;
      if (!currentUser) {
        currentUser = await connectWallet();
      }
      if (!currentUser) {
        alert("Please connect your wallet to verify ownership");
        navigate("/my-tickets");
        return false;
      }

      const ticket_owner = await contract.ownerOf(ticketId);
      if (ticket_owner.toLowerCase() === currentUser.toLowerCase()) {
        return true;
      }

      const marketplace = await getMarketplaceContract();
      const listing = await marketplace.resaleListings(ticketId);
      if (listing.seller && listing.seller.toLowerCase() === currentUser.toLowerCase()) {
        navigate("/my-tickets", { replace: true });
        return false;
      }

      alert("You do not own this ticket!");
      navigate("/my-tickets");
      return false;
    } catch (err) {
      console.warn("Ownership check failed:", err);
      const reason = err?.reason || err?.message || String(err);
      if (reason.includes("invalid token id") || reason.toLowerCase().includes("invalid token")) {
        alert("Ticket does not exist or has been burned");
      } else {
        alert("Unable to verify ticket ownership");
      }
      navigate("/my-tickets");
      return false;
    }
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
      currentResalePrice: ethers.formatEther(cap),
      status: ["Valid", "Used", "Resale", "Cancelled"][Number(ticketRaw[2])],
      resaleCommissionBps: Number(eventRaw[7]) / 100,
    };
    if (t.status !== "Valid" || ["Active", "Ended", "Cancelled"][Number(eventRaw[6])] !== "Active") {
      navigate("/my-tickets", { replace: true });
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
    try {
      const result = await listTicketForResale(ticketId);
      if (!result.success) {
        alert(result.error);
        return;
      }
      alert("Ticket listed for resale!");
      navigate("/my-tickets", { replace: true });
    } catch (error) {
      console.error(error);
      alert("Failed to list ticket for resale");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex justify-center items-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold text-slate-300 bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/40 transition"
          >
            ← Back
          </button>
        </div>
        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-b border-slate-700/50 p-8">
            <p className="text-xs uppercase tracking-widest text-amber-400 mb-2">Resale Listing</p>
            <h1 className="text-3xl text-white font-extrabold">Resell Ticket</h1>
            <p className="text-slate-400 mt-1">List your ticket on the marketplace — price is set automatically by the platform</p>
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
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Current Resale Price</p>
                  <p className="text-lg font-semibold text-amber-400">{ticket.currentResalePrice} <span className="text-sm text-amber-600">ETH</span></p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Commission Fee</p>
                <p className="text-lg font-semibold text-slate-300">{ticket.resaleCommissionBps}%</p>
              </div>
            </div>

            <div className="bg-slate-900/60 rounded-xl p-4 border border-amber-700/30">
              <p className="text-sm text-amber-300">The resale price is determined dynamically by the platform and decreases as the event approaches. Your ticket will sell at whatever the current price is when a buyer purchases it.</p>
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
