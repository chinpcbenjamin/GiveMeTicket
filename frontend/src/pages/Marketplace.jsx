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
        try {
          const tokenId = await marketplace.getActiveListingAt(i);
          const listing = await marketplace.resaleListings(tokenId);

          if (listing.seller.toLowerCase() === currentUser) continue;

          const ticketRaw = await ticketing.tickets(tokenId);
          const eventRaw = await ticketing.events(ticketRaw[0]);
          const cap = await ticketing.getResaleCap(tokenId);

          active.push({
            tokenId: Number(tokenId),
            eventName: eventRaw[0],
            seller: listing.seller,
            price: ethers.formatEther(listing.price),
            resaleCap: ethers.formatEther(cap),
          });
        } catch (err) {
          console.warn("Skipping listing due to error:", err);
          continue;
        }
      }

      setListings(active);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold text-slate-300 bg-slate-800/40 border border-slate-700/50 hover:bg-slate-700/40 transition"
          >
            ← Back
          </button>
        </div>

        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Secondary Market</p>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
            Resale Marketplace
          </h1>
          <p className="text-slate-400 mt-2">Browse tickets listed for resale by other users</p>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block w-8 h-8 border-2 border-slate-600 border-t-violet-400 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 text-lg">Loading listings...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-slate-500">No tickets listed for resale</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                      Ticket ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                      Event
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                      Seller
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                      Price Cap
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {listings.map((listing) => (
                    <tr key={listing.tokenId} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-400">
                        #{listing.tokenId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                        {listing.eventName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">
                        {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                        {listing.price} <span className="text-slate-400 font-normal">ETH</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {listing.resaleCap} <span className="text-slate-500">ETH</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <button
                          className="px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-900/30 transition-all duration-200 cursor-pointer text-sm"
                          onClick={() => navigate(`/resell-buy/${listing.tokenId}`)}
                        >
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

        {/* Back to Home removed: top back arrow provides navigation */}
      </div>
    </div>
  );
}
