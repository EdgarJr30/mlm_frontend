import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

interface Role {
    id: number;
    name: string;
}
interface DbUser {
    id: string;
    email: string;
    name: string | null;
    last_name: string | null;
    rol_id: number | null;
    created_at: string;
}
interface Props {
    searchTerm: string;
    selectedLocation: string;
}

export default function UsersBoard({ searchTerm, selectedLocation }: Props) {
    // listado real de usuarios (public.users)
    const [users, setUsers] = useState<DbUser[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);

    // modal crear
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rolId, setRolId] = useState<number | "">("");
    const [submitting, setSubmitting] = useState(false);
    const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    // (Tu búsqueda por texto + ubicación no afecta este listado de usuarios,
    // así que lo dejamos intacto por si luego filtras aquí también)
    const isSearching = searchTerm.length >= 2;

    // Cargar usuarios y roles
    const loadData = async () => {
        setLoading(true);
        try {
            const [{ data: usersData, error: usersErr }, { data: rolesData, error: rolesErr }] =
                await Promise.all([
                    supabase.from("users").select("*").order("created_at", { ascending: false }),
                    supabase.from("roles").select("id,name").order("name"),
                ]);

            if (usersErr) throw usersErr;
            if (rolesErr) throw rolesErr;

            setUsers(usersData ?? []);
            setRoles((rolesData ?? []) as Role[]);
        } catch (e: unknown) {
            const err = e as { message?: string };
            setMsg({ type: "err", text: err.message ?? "Error cargando datos" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Mantengo tu efecto, por si luego quieres usar search/filters aquí
    useEffect(() => {
        if (isSearching) {
            // Aquí podrías implementar filtro local o un query al backend si necesitas
            // Por ahora solo dejo el log original
            console.log("🟢 Ejecutando búsqueda desde UsersBoard:", searchTerm, selectedLocation);
        }
    }, [isSearching, searchTerm, selectedLocation]);

    const resetForm = () => {
        setName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setRolId("");
        setMsg(null);
    };

    const closeModal = () => {
        setOpen(false);
        resetForm();
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);

        if (!name || !email || !password || !rolId) {
            setMsg({ type: "err", text: "Completa todos los campos." });
            return;
        }

        setSubmitting(true);
        try {
            // 1) Crear en Auth (sin confirmación si está desactivada en settings)
            const { data: signUpRes, error: signUpErr } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { name } },
            });
            if (signUpErr) throw signUpErr;

            const newId = signUpRes.user?.id;
            if (!newId) throw new Error("No se obtuvo el ID del usuario creado en Auth.");

            // 2) Crear espejo en public.users (tu función valida admin/super_admin)
            const { error: rpcErr } = await supabase.rpc("create_user_in_public", {
                p_id: newId,
                p_email: email,
                p_name: name,
                p_last_name: lastName,
                p_rol_id: Number(rolId),
            });
            if (rpcErr) {
                // Si falla el RPC, el usuario queda en Auth sin fila en public.users.
                // Puedes limpiar manualmente en Auth desde el dashboard si es necesario.
                throw rpcErr;
            }

            setMsg({ type: "ok", text: "Usuario creado correctamente." });
            await loadData();
            setTimeout(closeModal, 700);
        } catch (err: unknown) {
            const errorMsg =
                typeof err === "object" && err !== null && "message" in err && typeof (err as { message?: unknown }).message === "string"
                    ? (err as { message: string }).message
                    : "Error creando usuario";
            setMsg({ type: "err", text: errorMsg });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold text-gray-900">Users</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        A list of all the users in your account including their name, email and role.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                    >
                        Add user
                    </button>
                </div>
            </div>

            {/* Tabla usuarios */}
            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        {loading ? (
                            <div className="text-sm text-gray-500 p-4">Cargando usuarios…</div>
                        ) : users.length === 0 ? (
                            <div className="text-sm text-gray-500 p-4">No hay usuarios.</div>
                        ) : (
                            <table className="relative min-w-full divide-y divide-gray-300">
                                <thead>
                                    <tr>
                                        <th className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                            Name
                                        </th>
                                         <th className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                            Last Name
                                        </th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Email
                                        </th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Role
                                        </th>
                                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Created
                                        </th>
                                        <th className="py-3.5 pr-4 pl-3 sm:pr-0">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {users.map((u) => {
                                        const roleName = roles.find((r) => r.id === u.rol_id)?.name ?? "—";
                                        return (
                                            <tr key={u.id}>
                                                <td className="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-0">
                                                    {u.name ?? "—"}
                                                </td>
                                                 <td className="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-0">
                                                    {u.last_name ?? "—"}
                                                </td>
                                                <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">{u.email}</td>
                                                <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">{roleName}</td>
                                                <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                                                    {new Date(u.created_at).toLocaleString("es-DO")}
                                                </td>
                                                <td className="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-0">
                                                    {/* Aquí luego agregas Edit / Delete si quieres */}
                                                    <span className="text-gray-400">—</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                        {msg && (
                            <p className={`mt-3 text-sm ${msg.type === "ok" ? "text-green-600" : "text-red-600"}`}>
                                {msg.text}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal crear usuario */}
            {open && (
                <div className="fixed inset-0 z-50">
                    <div className="fixed inset-0 bg-black/30" onClick={closeModal} />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-semibold">Crear usuario</h2>
                                <button onClick={closeModal} className="text-gray-500">✕</button>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                                Se creará en Auth y en public.users
                            </p>

                            <form onSubmit={handleCreateUser} className="mt-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nombre</label>
                                    <input
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Apellido</label>
                                    <input
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input
                                        type="password"
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Rol</label>
                                    <select
                                        className="mt-1 block w-full rounded-md border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        value={rolId}
                                        onChange={(e) => setRolId(Number(e.target.value))}
                                        required
                                    >
                                        <option value="">Selecciona un rol…</option>
                                        {roles.map((r) => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {msg && (
                                    <p className={`text-sm ${msg.type === "ok" ? "text-green-600" : "text-red-600"}`}>
                                        {msg.text}
                                    </p>
                                )}

                                <div className="mt-6 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="rounded-md border px-3 py-2 text-sm"
                                        disabled={submitting}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                                        disabled={submitting}
                                    >
                                        {submitting ? "Creando…" : "Crear usuario"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}