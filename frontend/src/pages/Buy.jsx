// need to handle the case where the user does not have enough ETH to buy the ticket
// need to handle the case where the not enough tickets left to buy

import { useState } from "react";

export default function Buy() {
  const [quantity, setQuantity] = useState(1);

  const ticketPrice = 5;
  const totalPrice = quantity * ticketPrice;

  let ticketsLeft = 128;

  const increaseQuantity = () => {
    setQuantity((prev) => prev + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleBuy = () => {
    alert(`Buying ${quantity} ticket(s) for ${totalPrice} ETH`);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center px-6 py-10">
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
                Blockchain Music Fest 2026
              </h2>
              <p className="text-gray-600 mt-2">
                Experience the future of ticketing with a blockchain-powered event.
              </p>
            </div>

            <div className="bg-gray-100 rounded-2xl p-5 space-y-3">
              <p className="text-lg">
                <span className="font-semibold">Price per Ticket:</span> {ticketPrice} ETH
              </p>
              <p className="text-lg">
                <span className="font-semibold">Tickets Left:</span> {ticketsLeft}
              </p>
            </div>

            <div className="bg-gray-100 rounded-2xl p-5">
              <p className="text-lg font-semibold mb-3">Select Quantity</p>
              <div className="pl-20 flex items-center gap-4">
                <button
                  onClick={decreaseQuantity}
                  className="w-12 h-12 rounded-xl bg-gray-300 hover:bg-gray-400 text-2xl font-bold"
                >
                  -
                </button>

                <div className="w-16 h-12 flex items-center justify-center bg-white rounded-xl text-xl font-bold border">
                  {quantity}
                </div>

                <button
                  onClick={increaseQuantity}
                  className="w-12 h-12 rounded-xl bg-gray-300 hover:bg-gray-400 text-2xl font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-blue-100 rounded-2xl p-5">
              <p className="text-xl font-bold text-gray-900">
                Total Price: {totalPrice} ETH
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Wallet connection and smart contract interaction will be added later.
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
    </div>
  );
}