import { useState, useEffect } from "react";
// import { ethers } from "ethers";
// import { getContract } from "../contract/useContract";


export default function Home() {
    const [ticketPrice, setTicketPrice] = useState(5); //for now i put 5 just as a test. need to integrate with backend later on

    // useEffect(() => {
    //     async function fetchPrice() {
    //         const contract = await getContract();
    //         const price = await contract.getTicketPrice(some_token_we_need_to_change);
    //         setTicketPrice(ethers.formatEther(price));
    //     }
    //     fetchPrice();
    // }, []);

    return (
        <div className="min-h-screen min-w-sc bg-white flex flex-col items-center py-20 px-4">
            <h1 className="text-5xl font-extrabold tracking-tight mb-16">
                GiveMeTicket
            </h1>

            <div className="flex flex-col gap-6 items-center">
                <div className="bg-black transition cursor-pointer rounded-2xl p-10 w-100 flex items-center justify-center">
                    <p className="text-xl text-white font-bold">Current Ticket Price: {ticketPrice} ETH</p>
                </div>

                <div className="bg-blue-400 hover:bg-blue-600 transition cursor-pointer rounded-2xl p-10 w-56 flex items-center justify-center">
                    <p className="text-xl text-white font-bold">Buy Ticket</p>
                </div>

                <div className="bg-blue-400 hover:bg-blue-600 transition cursor-pointer rounded-2xl p-10 w-56 flex items-center justify-center">
                    <p className="text-xl text-white font-bold">Resell Ticket</p>
                </div>
            </div>
        </div>
    )
}