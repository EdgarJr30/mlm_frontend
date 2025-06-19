import { useEffect, useState } from "react";

interface Props {
    onSearch: (term: string) => void;
}

export default function SearchTickets({ onSearch }: Props) {
    const [input, setInput] = useState("");
    const [debouncedInput, setDebouncedInput] = useState("");

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedInput(input);
        }, 500);

        return () => clearTimeout(timeout);
    }, [input]);

    useEffect(() => {
        if (debouncedInput.length >= 2 || debouncedInput.length === 0) {
            console.log("🔍 Buscando con:", debouncedInput); // 👈 AÑADIR ESTO
            onSearch(debouncedInput);
        }
    }, [debouncedInput, onSearch]);

    return (
        <div className="grid w-full max-w-lg grid-cols-1 lg:max-w-xs">
            <input
                type="search"
                placeholder="Buscar por ID, título, solicitante o ubicación..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="col-start-1 row-start-1 block w-full rounded-md bg-white py-1.5 pr-3 pl-10 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            />
        </div>
    );
}
