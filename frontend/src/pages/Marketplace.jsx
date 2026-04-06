// to add:
// - on successful buy, redirect to my tickets page
// - else, show error alert

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import {
  getContract,
  getMarketplaceContract,
  connectWallet,
} from "../contract/useContract";

export default function Marketplace() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  async function fetchListings() {
    try {
      const marketplace = await getMarketplaceContract();
      const ticketing = await getContract();
      const currentUser = (await connectWallet()).toLowerCase();

      const count = await marketplace.getActiveListingCount();
      const active = [];

      for (let i = 0; i < count; i++) {
        const tokenId = await marketplace.getActiveListingAt(i);
        const listing = await marketplace.resaleListings(tokenId);

        if (listing.seller.toLowerCase() === currentUser) continue;

        const ticketRaw = await ticketing.tickets(tokenId);
        const eventRaw = await ticketing.events(ticketRaw[0]);

        active.push({
          tokenId: Number(tokenId),
          eventName: eventRaw[0],
          seller: listing.seller,
          price: ethers.formatEther(listing.price),
        });
      }

      setListings(active);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    } finally {
      setLoading(false);
    }
  }

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
          {loading ? (
            <p className="text-center text-gray-500 text-lg py-8">
              Loading listings…
            </p>
          ) : listings.length === 0 ? (
            <p className="text-center text-gray-500 text-lg py-8">
              No tickets listed for resale.
            </p>
          ) : (
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
                      Seller
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
                  {listings.map((listing) => (
                    <tr key={listing.tokenId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                        #{listing.tokenId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {listing.eventName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                        {listing.seller.slice(0, 6)}…{listing.seller.slice(-4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {listing.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition"
                        onClick={() => navigate(`/resell-buy/${listing.tokenId}`)}>
                          Buy
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
