import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/navigation/Navbar";
import InboxBoard from "../components/inbox/InboxBoard";
// import SearchTickets from "../components/SearchTickets";

export default function InboxPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedLocation, setSelectedLocation] = useState("");

    return (
        <div className="h-screen flex bg-gray-100">
            <Sidebar />
            <main className="flex flex-col h-[100dvh] overflow-hidden flex-1">
                <div className="w-full">
                    {/* Navbar y búsqueda */}
                    <Navbar
                        onSearch={setSearchTerm}
                        onFilterLocation={setSelectedLocation}
                        selectedLocation={selectedLocation} />
                </div>

                <header className="px-4 md:px-6 lg:px-8 pb-0 pt-4 md:pt-6">
                    <h2 className="text-3xl font-bold">Bandeja de entrada</h2>
                </header>

                <section className="flex-1 overflow-x-auto overflow-y-hidden px-4 md:px-6 lg:px-8 pt-4 pb-8">
                    <InboxBoard searchTerm={searchTerm} />
                </section>
            </main>
        </div>
    );
}
