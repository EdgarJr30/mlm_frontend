import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { getFilteredTickets } from '../../services/ticketService';
import type { Ticket } from '../../types/Ticket';

interface Props {
    searchTerm: string;
}

const people = [
    {
        name: 'Lindsay Walton',
        title: 'Front-end Developer',
        email: 'lindsay.walton@example.com',
        role: 'Member',
    },
    // More people...
]

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export default function InboxBoard({ searchTerm }: Props) {
    const checkbox = useRef<HTMLInputElement>(null)
    const [checked, setChecked] = useState(false)
    const [indeterminate, setIndeterminate] = useState(false)
    const [selectedPeople, setSelectedPeople] = useState<typeof people>([])

    const [, setIsLoading] = useState(true);
    const [, setFilteredTickets] = useState<Ticket[]>([]);

    useLayoutEffect(() => {
        const isIndeterminate = selectedPeople.length > 0 && selectedPeople.length < people.length
        setChecked(selectedPeople.length === people.length)
        setIndeterminate(isIndeterminate)
        if (checkbox.current) {
            checkbox.current.indeterminate = isIndeterminate
        }
    }, [selectedPeople])

    function toggleAll() {
        setSelectedPeople(checked || indeterminate ? [] : people)
        setChecked(!checked && !indeterminate)
        setIndeterminate(false)
    }

    // Solo buscar cuando searchTerm está activo (>= 2 caracteres)
    useEffect(() => {
        if (searchTerm.length >= 2) {
            console.log("🟢 Ejecutando búsqueda desde InboxBoard:", searchTerm);
            setIsLoading(true);
            getFilteredTickets(searchTerm)
                .then(results => {
                    setFilteredTickets(results);
                    setIsLoading(false);
                });
        }
    }, [searchTerm]);


    return (
        <div className="px-4 sm:px-6 lg:px-8">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold text-gray-900">Users</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        A list of all the users in your account including their name, title, email and role.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button
                        type="button"
                        className="block rounded-md bg-indigo-600 px-3 py-1.5 text-center text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Add user
                    </button>
                </div>
            </div>
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="relative">
                            {selectedPeople.length > 0 && (
                                <div className="absolute top-0 left-14 flex h-12 items-center space-x-3 bg-white sm:left-12">
                                    <button
                                        type="button"
                                        className="inline-flex items-center rounded-sm bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
                                    >
                                        Bulk edit
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex items-center rounded-sm bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
                                    >
                                        Delete all
                                    </button>
                                </div>
                            )}
                            <table className="min-w-full table-fixed divide-y divide-gray-300">
                                <thead>
                                    <tr>
                                        <th scope="col" className="relative px-7 sm:w-12 sm:px-6">
                                            <div className="group absolute top-1/2 left-4 -mt-2 grid size-4 grid-cols-1">
                                                <input
                                                    type="checkbox"
                                                    className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                                                    ref={checkbox}
                                                    checked={checked}
                                                    onChange={toggleAll}
                                                />
                                                <svg
                                                    className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                                                    viewBox="0 0 14 14"
                                                    fill="none"
                                                >
                                                    <path
                                                        className="opacity-0 group-has-checked:opacity-100"
                                                        d="M3 8L6 11L11 3.5"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                    <path
                                                        className="opacity-0 group-has-indeterminate:opacity-100"
                                                        d="M3 7H11"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            </div>
                                        </th>
                                        <th scope="col" className="min-w-48 py-3.5 pr-3 text-left text-sm font-semibold text-gray-900">
                                            Name
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Title
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Email
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Role
                                        </th>
                                        <th scope="col" className="relative py-3.5 pr-4 pl-3 sm:pr-3">
                                            <span className="sr-only">Edit</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {people.map((person) => (
                                        <tr key={person.email} className={selectedPeople.includes(person) ? 'bg-gray-50' : undefined}>
                                            <td className="relative px-7 sm:w-12 sm:px-6">
                                                {selectedPeople.includes(person) && (
                                                    <div className="absolute inset-y-0 left-0 w-0.5 bg-indigo-600" />
                                                )}
                                                <div className="group absolute top-1/2 left-4 -mt-2 grid size-4 grid-cols-1">
                                                    <input
                                                        type="checkbox"
                                                        className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                                                        value={person.email}
                                                        checked={selectedPeople.includes(person)}
                                                        onChange={(e) =>
                                                            setSelectedPeople(
                                                                e.target.checked
                                                                    ? [...selectedPeople, person]
                                                                    : selectedPeople.filter((p) => p !== person),
                                                            )
                                                        }
                                                    />
                                                    <svg
                                                        className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                                                        viewBox="0 0 14 14"
                                                        fill="none"
                                                    >
                                                        <path
                                                            className="opacity-0 group-has-checked:opacity-100"
                                                            d="M3 8L6 11L11 3.5"
                                                            stroke-width="2"
                                                            stroke-linecap="round"
                                                            stroke-linejoin="round"
                                                        />
                                                        <path
                                                            className="opacity-0 group-has-indeterminate:opacity-100"
                                                            d="M3 7H11"
                                                            stroke-width="2"
                                                            stroke-linecap="round"
                                                            stroke-linejoin="round"
                                                        />
                                                    </svg>
                                                </div>
                                            </td>
                                            <td
                                                className={classNames(
                                                    'py-4 pr-3 text-sm font-medium whitespace-nowrap',
                                                    selectedPeople.includes(person) ? 'text-indigo-600' : 'text-gray-900',
                                                )}
                                            >
                                                {person.name}
                                            </td>
                                            <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">{person.title}</td>
                                            <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">{person.email}</td>
                                            <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">{person.role}</td>
                                            <td className="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-3">
                                                <a href="#" className="text-indigo-600 hover:text-indigo-900">
                                                    Edit<span className="sr-only">, {person.name}</span>
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
