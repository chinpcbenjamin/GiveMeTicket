// need to handle the case where the user does not have enough ETH to buy the ticket
// need to handle the case where the not enough tickets left to buy

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { getContract } from "../contract/useContract";

export default function Buy() {
  const navigate = useNavigate();

  const { ticketId } = useParams();
  useEffect(() => {
    if (ticketId == null) return;
    viewTicket(Number(ticketId));
  }, [ticketId]);

  const [event, setEvent] = useState(null);
  async function viewTicket(ticketId) {
    try {
      const contract = await getContract();
      const ticketRaw = await contract.tickets(ticketId);
      
      const evt = {
        ticketId: ticketId,
        eventId: ticketRaw[0],
        eventName: ticketRaw[1],
        facePrice: ethers.formatEther(ticketRaw[2]),
        status: ["Valid", "Used", "Resale", "Cancelled"][Number(ticketRaw[3])],
      };
      console.log("Ticket data:", ticket);
      setTicket(ticket);
    } catch (err) {
      console.error("Failed to fetch event:", err);
    }
  }

  async function buyTicket() {
    try {
      const contract = await getContract()
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
      navigate("/my-tickets")
    } else {
      alert("Failed to buy ticket")
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center px-6 py-10">
      {event && (
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="bg-black p-8">
          <h1 className="text-4xl text-white font-extrabold mb-2">Buy Ticket</h1>
          <p className="text-gray-300">
            Secure your ticket for the event through GiveMeTicket.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 p-8">
          <div className="bg-gray-200 rounded-2xl h-72 flex items-center justify-center text-gray-500 text-lg font-semibold">
            Event Banner Placeholder
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {event.name}
              </h2>
            </div>

            <div className="bg-gray-100 rounded-2xl p-5 space-y-3">
              <p className="text-lg">
                <span className="font-semibold">Price per Ticket:</span> {event.facePrice} ETH
              </p>
              <p className="text-lg">
                <span className="font-semibold">Tickets Left:</span> {event.totalSupply - event.ticketsSold}
              </p>
            </div>


            <button
              onClick={handleBuy}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 rounded-2xl transition"
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