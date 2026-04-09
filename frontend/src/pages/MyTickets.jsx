// need to modify this to take the current userid's tickets from smart contract itself
// instead of the const myTickets
// do not need multiple event tickets for now. just one event ticket

// can just use userid = 1 since we do not connect to any wallet yet

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getContract, getMarketplaceContract, connectWallet } from "../contract/useContract";
import { getMarketplaceAddress } from "../contract/config";
import { useAccount } from "../contract/AccountContext.jsx";
import { ethers } from "ethers";

export default function MyTickets() {
  const navigate = useNavigate();
  const { account } = useAccount();
  const [myTickets, setMyTickets] = useState([]);
  const [showUseModal, setShowUseModal] = useState(false);
  const [ticketToUse, setTicketToUse] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [countdown, setCountdown] = useState(8);
  const [pendingProceeds, setPendingProceeds] = useState(0n);
  const [pendingRefundBal, setPendingRefundBal] = useState(0n);

  async function fetchTickets() {
      const contract = await getContract();
      const marketplace = await getMarketplaceContract();
      const addr = await connectWallet();
      if (!addr) return;
      const currentUser = addr.toLowerCase();
      const marketplaceAddr = await getMarketplaceAddress();
      const marketplaceLower = marketplaceAddr.toLowerCase();

      const nextTokenId = Number(await contract.nextTokenId());
      const myTicketsList = [];

      for (let i = 0; i < nextTokenId; i++) {
            try {
              const owner = (await contract.ownerOf(i)).toLowerCase();

              let isMine = owner === currentUser;

              if (!isMine && owner === marketplaceLower) {
                const listing = await marketplace.resaleListings(i);
                isMine = listing.seller.toLowerCase() === currentUser;
              }

              if (!isMine) continue;

              const ticketRaw = await contract.tickets(i);
              const eventRaw = await contract.events(ticketRaw[0]);
              const rawStatus = ["Valid", "Used", "Resale", "Cancelled"][Number(ticketRaw[2])];
              const eventStatus = ["Active", "Ended", "Cancelled"][Number(eventRaw[6])];
              let displayStatus = rawStatus;
              if (rawStatus === "Valid" && eventStatus === "Ended") displayStatus = "Event Ended";
              if (rawStatus === "Valid" && eventStatus === "Cancelled") displayStatus = "Event Cancelled";

              const ticket = {
                ticketId: i,
                eventId: ticketRaw[0],
                eventName: eventRaw[0],
                facePrice: ethers.formatEther(ticketRaw[1]),
                rawStatus: rawStatus,
                status: displayStatus,
                eventStatus: eventStatus,
              };
              myTicketsList.push(ticket);
            } catch (err) {
              console.warn(`Skipping token ${i} due to error:`, err);
              continue;
            }
      }
      setMyTickets(myTicketsList);

      const proceeds = await marketplace.pendingWithdrawals(currentUser);
      setPendingProceeds(proceeds);

      const refundBal = await contract.pendingRefunds(currentUser);
      setPendingRefundBal(refundBal);
  }

  useEffect(() => {
    fetchTickets();
  }, [account]);

  async function handleClaimProceeds() {
    try {
      const marketplace = await getMarketplaceContract();
      const tx = await marketplace.claimProceeds();
      await tx.wait();
      await fetchTickets();
    } catch (err) {
      console.error(err);
      alert("Failed to claim proceeds");
    }
  }

  async function handleClaimRefund(ticketId) {
    try {
      const contract = await getContract();
      const tx = await contract.claimRefund(ticketId);
      await tx.wait();
      await fetchTickets();
    } catch (err) {
      console.error(err);
      alert("Failed to claim refund");
    }
  }

  async function handleWithdrawRefund() {
    try {
      const contract = await getContract();
      const tx = await contract.withdrawRefund();
      await tx.wait();
      await fetchTickets();
    } catch (err) {
      console.error(err);
      alert("Failed to withdraw refund");
    }
  }

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

  function handleUseClick(ticket) {
    setTicketToUse(ticket);
    setShowUseModal(true);
  }

  function startUseSimulation() {
    if (!ticketToUse) return;
    setShowUseModal(false);
    setCountdown(8);
    setShowQRModal(true);
  }

  function cancelUse() {
    setShowUseModal(false);
    setTicketToUse(null);
  }

  useEffect(() => {
    if (!showQRModal) return;
    let t = countdown;
    const id = setInterval(() => {
      t -= 1;
      setCountdown(t);
        if (t <= 0) {
        clearInterval(id);
        // finalize simulated use
        const idNum = ticketToUse?.ticketId;
        if (typeof idNum === "number") {
          setMyTickets((prev) => prev.map(t => t.ticketId === idNum ? {...t, status: "Used"} : t));
        }
        setShowQRModal(false);
        setTicketToUse(null);
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showQRModal]);

  const statusStyles = {
    Valid: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Used: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Resale: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Cancelled: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    "Event Ended": "bg-slate-500/20 text-slate-400 border-slate-500/30",
    "Event Cancelled": "bg-rose-500/20 text-rose-400 border-rose-500/30",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <div className="mb-4">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold text-slate-300 bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/40 transition"
            >
              ← Home
            </button>
          </div>
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Your Collection</p>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            My Tickets
          </h1>
          <p className="text-slate-400 mt-2">View and manage all tickets in your wallet</p>
        </div>

        {pendingProceeds > 0n && (
          <div className="mb-6 bg-amber-900/30 border border-amber-700/50 rounded-2xl px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-500 mb-0.5">Pending Resale Proceeds</p>
              <p className="text-xl font-bold text-amber-300">{ethers.formatEther(pendingProceeds)} <span className="text-sm text-amber-500">ETH</span></p>
            </div>
            <button
              onClick={handleClaimProceeds}
              className="px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-900/30 transition-all duration-200 cursor-pointer text-sm"
            >
              Claim
            </button>
          </div>
        )}

        {pendingRefundBal > 0n && (
          <div className="mb-6 bg-rose-900/30 border border-rose-700/50 rounded-2xl px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-rose-400 mb-0.5">Pending Refunds</p>
              <p className="text-xl font-bold text-rose-300">{ethers.formatEther(pendingRefundBal)} <span className="text-sm text-rose-500">ETH</span></p>
            </div>
            <button
              onClick={handleWithdrawRefund}
              className="px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-lg shadow-rose-900/30 transition-all duration-200 cursor-pointer text-sm"
            >
              Withdraw
            </button>
          </div>
        )}

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
                  {ticket.rawStatus === "Valid" && ticket.eventStatus === "Active" && (
                    <>
                      <button
                        className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-900/30 transition-all duration-200 cursor-pointer text-sm"
                        onClick={() => navigate(`/resell/${ticket.ticketId}`)}
                      >
                        Resell
                      </button>
                      <button
                        className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-900/30 transition-all duration-200 cursor-pointer text-sm"
                        onClick={() => handleUseClick(ticket)}
                      >
                        Simulate Use
                      </button>
                    </>
                  )}
                  {ticket.rawStatus === "Valid" && ticket.eventStatus === "Cancelled" && (
                    <button
                      onClick={() => handleClaimRefund(ticket.ticketId)}
                      className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-lg shadow-rose-900/30 transition-all duration-200 cursor-pointer text-sm"
                    >
                      Claim Refund
                    </button>
                  )}
                  {ticket.rawStatus === "Resale" && (
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

        {showUseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={cancelUse}></div>
            <div className="relative bg-slate-800/90 border border-slate-700/50 rounded-2xl p-6 w-full max-w-md z-10">
              <h3 className="text-lg font-bold text-white">Use Ticket — Simulation</h3>
              <p className="text-slate-400 mt-2">Event: {ticketToUse?.eventName}</p>
              <p className="text-slate-400">Ticket ID: #{ticketToUse?.ticketId}</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={startUseSimulation}
                  className="flex-1 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 transition-all duration-200"
                >
                  Start Simulation
                </button>
                <button
                  onClick={cancelUse}
                  className="flex-1 py-2 rounded-xl font-semibold text-slate-400 bg-slate-800/40 border border-slate-700/50 hover:text-white transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3">Note: This is a frontend-only simulation of an admin scanning a QR code. The "Used" status will not persist if you navigate away or refresh the page.</p>
            </div>
          </div>
        )}

        {showQRModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60"></div>
            <div className="relative bg-slate-800/95 border border-slate-700/50 rounded-2xl p-6 w-full max-w-sm z-10 text-center">
              <h3 className="text-lg font-bold text-white">Present this QR to Admin</h3>
              <div className="mx-auto my-4 w-48 h-48 bg-white p-4 rounded-md inline-block">
                <svg viewBox="0 0 120 120" className="w-full h-full">
                  <rect x="0" y="0" width="120" height="120" fill="#ffffff" />
                  <rect x="6" y="6" width="30" height="30" fill="#000" />
                  <rect x="84" y="6" width="30" height="30" fill="#000" />
                  <rect x="6" y="84" width="30" height="30" fill="#000" />
                  {Array.from({ length: 20 }).map((_, idx) => {
                    const x = 18 + (idx % 5) * 18;
                    const y = 18 + Math.floor(idx / 5) * 18;
                    const fill = ((ticketToUse?.ticketId ?? 0) + idx) % 3 === 0 ? '#000' : 'none';
                    return <rect key={idx} x={x} y={y} width="12" height="12" fill={fill} />;
                  })}
                </svg>
              </div>
              <p className="text-slate-300">Ticket #{ticketToUse?.ticketId}</p>
              <p className="text-sm text-slate-400 mt-2">Waiting for admin scan... <span className="font-mono">{countdown}s</span></p>
              <p className="text-xs text-slate-500 mt-3">Simulation will complete automatically when the timer reaches zero.</p>
            </div>
          </div>
        )}

        {/* Back to Home removed: top back arrow provides navigation */}
      </div>
    </div>
  );
}
