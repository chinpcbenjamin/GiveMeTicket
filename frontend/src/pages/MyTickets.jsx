// need to modify this to take the current userid's tickets from smart contract itself
// instead of the const myTickets
// do not need multiple event tickets for now. just one event ticket

// can just use userid = 1 since we do not connect to any wallet yet

export default function MyTickets() {
  const myTickets = [
    {
      id: "1",
      event: "Blockchain Music Fest 2026",
      price: 5,
      status: 1
    },
    {
      id: "243",
      event: "Blockchain Music Fest 2026",
      price: 5,
      status: 2
    },
    {
      id: "3449",
      event: "Blockchain Music Fest 2026",
      price: 5,
      status: 3,
    },
  ];

  const TicketStatus = {
    1: "Active",
    2: "Listed for Resale",
    3: "Used",
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center px-6 py-10">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="bg-black p-8">
          <h1 className="text-4xl text-white font-extrabold mb-2">My Tickets</h1>
          <p className="text-gray-300">
            View all tickets currently owned by your wallet.
          </p>
        </div>

        <div className="p-8">
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {myTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {ticket.event}
                  </h2>
                  <span
                    className={`text-sm font-semibold px-3 py-1 rounded-full ${
                      ticket.status === 1
                        ? "bg-green-100 text-green-700"
                        : ticket.status === 2
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {TicketStatus[ticket.status]}
                  </span>
                </div>

                <div className="space-y-2 text-gray-700">
                  <p>
                    <span className="font-semibold">Ticket ID:</span> #{ticket.id}
                  </p>
                  <p>
                    <span className="font-semibold">Price:</span> {ticket.price} ETH
                  </p>
                </div>

                <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">QR / NFT Preview</p>
                  <div className="h-24 flex items-center justify-center rounded-lg bg-gray-100 text-gray-400 font-semibold">
                    Ticket Preview
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition">
                    View Details
                  </button>
                  {
                    ticket.status == 1 && (
                      <button className="flex-1 bg-black hover:bg-gray-800 text-white font-bold py-3 rounded-xl transition">
                        Resell
                      </button>
                    )
                  }
                  {
                    ticket.status == 2 && (
                      <button className="flex-1 bg-red-500 hover:bg-red-300 text-white font-bold py-3 rounded-xl transition">
                        Cancel Resale
                      </button>
                    )
                  }
                </div>
              </div>
            ))}
          </div>

          {myTickets.length === 0 && (
            <div className="text-center py-16">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                No tickets found
              </h2>
              <p className="text-gray-500">
                Tickets connected to the wallet will appear here later.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}