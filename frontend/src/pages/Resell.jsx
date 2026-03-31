import { useState } from "react";

export default function Resell() {
  const [selectedTicket, setSelectedTicket] = useState("TICKET-001");
  const [resellPrice, setResellPrice] = useState("6");

  const ownedTickets = [
    {
      id: "TICKET-001",
      event: "Blockchain Music Fest 2026",
      date: "20 April 2026",
      venue: "Marina Bay Sands Expo",
      originalPrice: "5 ETH",
      status: "Owned",
    },
    {
      id: "TICKET-002",
      event: "Web3 Tech Conference 2026",
      date: "12 May 2026",
      venue: "Suntec Convention Centre",
      originalPrice: "3 ETH",
      status: "Owned",
    },
  ];

  const currentTicket =
    ownedTickets.find((ticket) => ticket.id === selectedTicket) || ownedTickets[0];

  const handleResell = () => {
    alert(
      `Listing ${selectedTicket} for resale at ${resellPrice} ETH`
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center px-6 py-10">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="bg-black text-white p-8">
          <h1 className="text-4xl font-extrabold mb-2">Resell Ticket</h1>
          <p className="text-gray-300">
            List your owned ticket on the marketplace for resale.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 p-8">
          <div className="bg-gray-100 rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-lg font-semibold mb-2">
                Select Ticket
              </label>
              <select
                value={selectedTicket}
                onChange={(e) => setSelectedTicket(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-lg"
              >
                {ownedTickets.map((ticket) => (
                  <option key={ticket.id} value={ticket.id}>
                    {ticket.id} — {ticket.event}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-2xl p-5 space-y-3 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">
                {currentTicket.event}
              </h2>
              <p className="text-lg">
                <span className="font-semibold">Ticket ID:</span> {currentTicket.id}
              </p>
              <p className="text-lg">
                <span className="font-semibold">Date:</span> {currentTicket.date}
              </p>
              <p className="text-lg">
                <span className="font-semibold">Venue:</span> {currentTicket.venue}
              </p>
              <p className="text-lg">
                <span className="font-semibold">Original Price:</span>{" "}
                {currentTicket.originalPrice}
              </p>
              <p className="text-lg">
                <span className="font-semibold">Status:</span> {currentTicket.status}
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

            <div className="bg-blue-100 rounded-2xl p-5">
              <p className="text-xl font-bold text-gray-900">
                Listing Price: {resellPrice || "0"} ETH
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Smart contract validation and listing logic will be connected later.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
              <p className="text-sm text-yellow-800">
                Make sure you only list tickets that are valid and owned by your
                wallet. This page is currently frontend-only.
              </p>
            </div>

            <button
              onClick={handleResell}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 rounded-2xl transition"
            >
              List for Resale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}