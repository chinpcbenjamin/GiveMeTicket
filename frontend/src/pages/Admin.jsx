import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { connectWallet, getContract } from "../contract/useContract";


export default function Admin() {
    const navigate = useNavigate();

    const [account, setAccount] = useState(null);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [eventName, setEventName] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [totalSupply, setTotalSupply] = useState("");
    const [facePrice, setFacePrice] = useState("");
    const [resaleCapBps, setResaleCapBps] = useState("");

    async function handleConnectWallet() {
        try {
            const connected = await connectWallet();
            setAccount(connected);
            console.log("Connected wallet:", connected);
        } catch (err) {
            console.error("Failed to connect wallet:", err);
        }
    }

    async function getOwnerAddress() {
        try {
            const contract = await getContract();
            const owner = await contract.owner()
            console.log("Owner:", owner)
        } catch (err) {
            console.error(err)
        }
    }

    async function withdrawMoney() {
        try {
            const contract = await getContract();
            const tx = await contract.withdraw()
            console.log("Successfully withdrawed")
        } catch (err) {
            alert("You are not the owner!")
            console.error(err)
        }
    }

    async function createEvent() {
        try {
            const contract = await getContract();
            const tx = await contract.createEvent(
                eventName, 
                Math.floor(new Date(eventDate).getTime() / 1000),
                totalSupply,
                ethers.parseEther(facePrice),
                resaleCapBps * 100
            );

            console.log("Transaction sent! Waiting for confirmation...");
            const receipt = await tx.wait();
            console.log("Event created!", receipt);
            return true
        } catch (err) {
            console.error(err);
        }
    }

    const handleCreateEvent = async() => {
        const ok = await createEvent()
        if (ok) {
            window.location.reload()
        } else {
            alert("You are not the owner!")
        }
    };

    return (
        <div className="min-h-screen min-w-sc bg-white flex flex-col items-center py-20 px-4">
            <h1 className="text-5xl font-extrabold tracking-tight mb-16">
                GiveMeTicket Admin
            </h1>

            <div className="flex flex-col gap-6 items-center">
                {account && (
                    <div
                        className="bg-black hover:bg-gray-800 transition cursor-pointer rounded-2xl p-10 w-192 text-center">
                        <p className="text-xl text-white font-bold">Connected Wallet: {account}</p>
                    </div>
                )}

                {account && (
                    <div
                        className="bg-pink-400 hover:bg-gray-800 transition cursor-pointer rounded-2xl p-10 w-64 text-center"
                        onClick={() => getOwnerAddress()}
                    >
                        <p className="text-xl text-white font-bold">GetOwnerAddress (Debug)</p>
                    </div>
                )}

                {account && (
                    <div
                        className="bg-green-400 hover:bg-gray-800 transition cursor-pointer rounded-2xl p-10 w-56 text-center"
                        onClick={() => withdrawMoney()}
                    >
                        <p className="text-xl text-white font-bold">Withdraw Money</p>
                    </div>
                )}

                {account && (
                    <div 
                        className="bg-blue-400 hover:bg-blue-600 transition cursor-pointer rounded-2xl p-10 w-56 flex items-center justify-center"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <p className="text-xl text-white font-bold">Create Event</p>
                    </div>
                )}

                {!account && (
                    <button
                        className="bg-yellow-400 hover:bg-yellow-500 text-white transition rounded-2xl p-6 w-56 font-bold"
                        onClick={handleConnectWallet}
                    >
                    Connect Wallet
                    </button>
                )}

                {showCreateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-white rounded-2xl p-8 w-150 flex flex-col gap-4">
                            
                            <h2 className="text-2xl font-bold text-center">Create Event</h2>

                            <input
                                type="text"
                                placeholder="Event Name"
                                className="border p-2 rounded"
                                value={eventName}
                                onChange={(e) => setEventName(e.target.value)}
                            />

                            <input
                                type="datetime-local"
                                className="border p-2 rounded"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                            />

                            <input
                                type="number"
                                placeholder="Total Supply"
                                className="border p-2 rounded"
                                value={totalSupply}
                                onChange={(e) => setTotalSupply(e.target.value)}
                            />

                            <input
                                type="number"
                                placeholder="Face Price (ETH)"
                                className="border p-2 rounded"
                                value={facePrice}
                                onChange={(e) => setFacePrice(e.target.value)}
                            />

                            <input
                                type="number"
                                placeholder="Resale Cap. If you allow maximum 20% markup, use '120'"
                                className="border p-2 rounded"
                                value={resaleCapBps}
                                onChange={(e) => setResaleCapBps(e.target.value)}
                            />

                            <div className="flex gap-4 mt-4">
                                <button
                                    className="bg-gray-400 text-white px-4 py-2 rounded w-full"
                                    onClick={() => setShowCreateModal(false)}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="bg-green-500 text-white px-4 py-2 rounded w-full"
                                    onClick={() => handleCreateEvent()}
                                >
                                    Create Event
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}