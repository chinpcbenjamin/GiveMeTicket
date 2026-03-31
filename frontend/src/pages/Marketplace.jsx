// to add:
// - on successful buy, redirect to my tickets page
// - else, show error alert

export default function Marketplace() {
    const mock_listing = [
        {
            ticket_id: 1,
            event: "Blockchain Music Fest 2026",
            seller_id: 2,
            list_price: 6
        },
        {
            ticket_id: 243,
            event: "Blockchain Music Fest 2026",
            seller_id: 30,
            list_price: 7
        },
        {
            ticket_id: 3449,
            event: "Blockchain Music Fest 2026",
            seller_id: 63,
            list_price: 7
        },
        {
            ticket_id: 5036,
            event: "Blockchain Music Fest 2026",
            seller_id: 42,
            list_price: 6.5
        }
    ]

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center px-6 py-10">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="bg-black text-white p-8">
          <h1 className="text-4xl font-extrabold mb-2">Resell Listings</h1>
          <p className="text-gray-300">
            Browse tickets listed for resale on GiveMeTicket.
          </p>
        </div>

        <div className="p-8">
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-gray-50">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ticket ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Seller ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    List Price (ETH)
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mock_listing.map((listing) => (
                  <tr key={listing.ticket_id + "-" + listing.seller_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      #{listing.ticket_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {listing.event}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {listing.seller_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {listing.list_price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition">
                        Buy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}