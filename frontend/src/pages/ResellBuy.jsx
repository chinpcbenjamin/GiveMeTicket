import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getContract, getMarketplaceContract } from "../contract/useContract";

export default function ResellBuy() {
  const navigate = useNavigate();

  const { ticketId } = useParams();
  useEffect(() => {
    if (ticketId == null) return;
    viewTicket(Number(ticketId));
  }, [ticketId]);

  const [ticket, setTicket] = useState(null);
  async function viewTicket(ticketId) {
    try {
      const ticketing = await getContract();
      const marketplace = await getMarketplaceContract();
      const ticketRaw = await ticketing.tickets(ticketId);
      const resaleListing = await marketplace.resaleListings(ticketId);
      const eventRaw = await ticketing.events(ticketRaw[0]);

      if (resaleListing[0] === ethers.ZeroAddress) {
        alert("This ticket is not listed for resale.");
        navigate("/marketplace");
        return;
      }

      const cap = await ticketing.getResaleCap(ticketId);

      const t = {
        ticketId: ticketId,
        eventId: ticketRaw[0],
        eventName: eventRaw[0],
        facePrice: ethers.formatEther(ticketRaw[1]),
        seller: resaleListing[0],
        resalePrice: ethers.formatEther(resaleListing[1]),
        currentResaleCap: ethers.formatEther(cap),
        status: ["Valid", "Used", "Resale", "Cancelled"][Number(ticketRaw[2])],
      };
      console.log("Ticket data:", t);
      setTicket(t);
    } catch (err) {
      console.error("Failed to fetch ticket:", err);
    }
  }

  async function buyResaleTicket() {
    try {
      const marketplace = await getMarketplaceContract();
      const tx = await marketplace.buyResaleTicket(ticketId, {
        value: ethers.parseEther(ticket.resalePrice),
      });
      await tx.wait();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  const handleResellBuy = async () => {
    try {
      const ok = await buyResaleTicket();
      if (ok) {
        alert("Resale ticket purchased successfully!");
        navigate("/my-tickets");
      } else {
        alert("Failed to buy ticket");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to buy ticket");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex justify-center items-center px-4 py-16">
      {ticket && (
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
          <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b border-slate-700/50 p-8">
            <p className="text-xs uppercase tracking-widest text-cyan-400 mb-2">Resale Marketplace</p>
            <h1 className="text-3xl text-white font-extrabold">{ticket.eventName}</h1>
            <p className="text-slate-400 mt-1">Purchase a resale ticket</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-700/30 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Original Price</p>
                  <p className="text-lg font-semibold text-slate-400">{ticket.facePrice} <span className="text-sm">ETH</span></p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Resale Price</p>
                  <p className="text-2xl font-bold text-white">{ticket.resalePrice} <span className="text-sm text-slate-400">ETH</span></p>
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Price Cap</p>
                <p className="text-lg font-semibold text-amber-400">{ticket.currentResaleCap} <span className="text-sm text-amber-600">ETH</span></p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Seller</p>
                <p className="text-sm text-slate-300 font-mono">{ticket.seller}</p>
              </div>
            </div>

            <button
              onClick={handleResellBuy}
              className="w-full py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-900/40 transition-all duration-200 cursor-pointer"
            >
              Buy Now &mdash; {ticket.resalePrice} ETH
            </button>

            <button
              onClick={() => navigate("/marketplace")}
              className="w-full py-3 rounded-xl font-semibold text-slate-400 bg-slate-800/40 border border-slate-700/50 hover:text-white hover:bg-slate-700/40 transition-all duration-200 cursor-pointer"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
