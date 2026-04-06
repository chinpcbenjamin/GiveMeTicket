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
    <div className="min-h-screen bg-gray-100 flex justify-center items-center px-6 py-10">
      {ticket && (
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="bg-black p-8">
          <h1 className="text-4xl text-white font-extrabold mb-2">Buy Resale Ticket</h1>
          <p className="text-gray-300">
            Buy a resale ticket for the event through GiveMeTicket.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 p-8">
          <div className="bg-gray-200 rounded-2xl h-72 flex items-center justify-center text-gray-500 text-lg font-semibold">
            Event Banner Placeholder
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {ticket.eventName}
              </h2>
            </div>

            <div className="bg-gray-100 rounded-2xl p-5 space-y-3">
              <p className="text-lg">
                <span className="font-semibold">Original Price per Ticket:</span> {ticket.facePrice} ETH
              </p>
              <p className="text-medium">
                <span className="font-semibold">Seller:</span> {ticket.seller}
              </p>
              <p className="text-medium">
                <span className="font-semibold">Resale Price per Ticket (You Pay):</span> {ticket.resalePrice} ETH
              </p>
              <p className="text-medium">
                <span className="font-semibold">Current Price Cap:</span> {ticket.currentResaleCap} ETH
              </p>
            </div>


            <button
              onClick={handleResellBuy}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white text-xl font-bold py-4 rounded-2xl transition"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}