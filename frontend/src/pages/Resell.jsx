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
      return;
    }
  }

  async function getTicket() {
    const contract = await getContract();
    const ticketRaw = await contract.tickets(ticketId);
    const eventRaw = await contract.events(ticketRaw[0]);
    const t = {
      ticketId: ticketId,
      eventId: ticketRaw[0],
      eventName: eventRaw[0],
      facePrice: ethers.formatEther(ticketRaw[1]),
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
      await checkOwnership();
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
      navigate("/marketplace");
    } catch (error) {
      console.error(error);
      alert("Failed to list ticket for resale");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center px-6 py-10">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="bg-black text-white p-8">
          <h1 className="text-4xl font-extrabold mb-2">Resell Ticket</h1>
          <p className="text-gray-300">
            List your owned ticket on the marketplace for resale.
          </p>
        </div>
        {ticket && (
        <div className="grid md:grid-cols-2 gap-8 p-8">
          <div className="bg-gray-100 rounded-2xl p-6 space-y-5">

            <div className="bg-white rounded-2xl p-5 space-y-3 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">
                {ticket.eventName}
              </h2>
              <p className="text-lg">
                <span className="font-semibold">Ticket ID:</span> #{ticket.ticketId}
              </p>
              <p className="text-lg">
                <span className="font-semibold">Original Price:</span>{" "}
                {ticket.facePrice} ETH
              </p>
              <p className="text-lg">
                <span className="font-semibold">Status:</span> {ticket.status}
              </p>
              <p className="text-lg">
                <span className="font-semibold">Resale Commission Fee:</span> {ticket.resaleCommissionBps}%
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="bg-gray-100 rounded-2xl p-5">
              <label className="block text-lg font-semibold mb-3">
                Set Resale Price
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={resellPrice}
                  onChange={(e) => setResellPrice(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-lg"
                  placeholder="Enter resale price"
                />
                <span className="text-lg font-bold text-gray-700">ETH</span>
              </div>
            </div>

            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 rounded-2xl transition"
              onClick={handleResell}
            >
              List for Resale
            </button>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}