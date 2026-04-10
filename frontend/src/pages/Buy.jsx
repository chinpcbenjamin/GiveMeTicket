// need to handle the case where the user does not have enough ETH to buy the ticket
// need to handle the case where the not enough tickets left to buy

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getContract } from "../contract/useContract";
import { useAccount } from "../contract/AccountContext.jsx";

export default function Buy() {
  const navigate = useNavigate();

  const { eventId } = useParams();
  useEffect(() => {
    if (eventId == null) return;
    viewEvent(Number(eventId));
  }, [eventId]);

  const [event, setEvent] = useState(null);
  const [ownerAddress, setOwnerAddress] = useState(null);
  const { account, connectWallet } = useAccount();
  async function viewEvent(eventId) {
    try {
      const contract = await getContract();
      const owner = await contract.owner();
      setOwnerAddress(owner);
      const eventRaw = await contract.events(eventId);
      
      const evt = {
        eventId: eventId,
        eventName: eventRaw[0],
        facePrice: ethers.formatEther(eventRaw[4]),
        totalSupply: Number(eventRaw[2]),
        ticketsSold: Number(eventRaw[3]),
        status: ["Active", "Ended", "Cancelled"][Number(eventRaw[6])],
      };
      if (evt.status !== "Active") {
        alert("This event is not active.");
        navigate("/events", { replace: true });
        return;
      }
      if (evt.totalSupply - evt.ticketsSold <= 0) {
        alert("This event is sold out.");
        navigate("/events", { replace: true });
        return;
      }
      setEvent(evt);
    } catch (err) {
      console.error("Failed to fetch event:", err);
    }
  }

  async function buyTicket() {
    try {
      const contract = await getContract()
      // extra frontend guard: prevent organizer (owner) from buying
      const currentUser = account || (await connectWallet());
      const owner = await contract.owner();
      if (owner && currentUser && owner.toLowerCase() === currentUser.toLowerCase()) {
        alert("Organizers cannot purchase tickets for their own events.");
        return false;
      }

      const tx = await contract.buyTicket(eventId, { value: ethers.parseEther(event.facePrice) })
      await tx.wait()
      console.log("Ticket bought!")
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const handleBuy = async() => {
    const ok = await buyTicket()
    if (ok) {
      alert("Ticket purchased successfully!");
      navigate("/my-tickets", { replace: true })
    } else {
      alert("Failed to buy ticket")
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex justify-center items-center px-4 py-16">
      {event && (
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
          <div className="bg-gradient-to-r from-violet-600/20 to-indigo-600/20 border-b border-slate-700/50 p-8">
            <p className="text-xs uppercase tracking-widest text-violet-400 mb-2">Official Ticket</p>
            <h1 className="text-3xl text-white font-extrabold">{event.eventName}</h1>
            <p className="text-slate-400 mt-1">Secure your spot through GiveMeTicket</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-700/30">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Price per Ticket</p>
                  <p className="text-2xl font-bold text-white">{event.facePrice} <span className="text-sm text-slate-400">ETH</span></p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Tickets Remaining</p>
                  <p className="text-2xl font-bold text-emerald-400">{event.totalSupply - event.ticketsSold}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleBuy}
              disabled={Boolean(ownerAddress && account && ownerAddress.toLowerCase() === account.toLowerCase())}
              className={`w-full py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-900/40 transition-all duration-200 ${ownerAddress && account && ownerAddress.toLowerCase() === account.toLowerCase() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {ownerAddress && account && ownerAddress.toLowerCase() === account.toLowerCase() ? 'Organizers cannot buy' : 'Buy Now'}
            </button>

          </div>
        </div>
      </div>
      )}
    </div>
  );
}
