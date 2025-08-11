import { useEffect, useState } from "react";
import { getSession } from "../utils/auth";
import Sidebar from "../components/ui/Sidebar";
import Navbar from "../components/navigation/Navbar";

export default function UserDashboard() {
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [/*searchTerm*/, setSearchTerm] = useState("");
    const [selectedLocation, setSelectedLocation] = useState("");


    useEffect(() => {
        (async () => {
            const { data } = await getSession();
            if (data.session?.user) {
                setUserEmail(data.session.user.email ?? null);
            }
        })();
    }, []);

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
                    <h2 className="text-3xl font-bold">Usuarios</h2>
                </header>

                <section className="flex-1 overflow-x-auto px-4 md:px-6 lg:px-8 pt-4 pb-8">
                    <div className="p-8">
                        <h1 className="text-2xl font-bold">Mi Usuario</h1>
                        <p className="mt-4">Bienvenido{userEmail ? `, ${userEmail}` : ""}</p>
                        <p className="mt-2 text-gray-600">
                            Aquí podrás ver tu información, historial de tickets y otras funciones disponibles para tu rol.
                        </p>
                    </div>
                </section>
            </main>
        </div>

    );
}
