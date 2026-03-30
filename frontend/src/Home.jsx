export default function Home() {
    return (
        <div className="min-h-screen min-w-sc bg-white flex flex-col items-center py-20 px-4">
            <h1 className="text-5xl font-extrabold tracking-tight mb-16">
                GiveMeTicket
            </h1>

            <div className="flex flex-col gap-6 items-center">
                <div className="bg-black transition cursor-pointer rounded-2xl p-10 w-100 flex items-center justify-center">
                    <p className="text-xl text-white font-bold">Current Ticket Price:</p>
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