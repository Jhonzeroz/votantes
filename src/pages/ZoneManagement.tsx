import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, User, MapPin, Check, Edit2, Search, X, Map } from "lucide-react";

// --- Definición de Tipos ---

interface Zona {
    ID_ZONA: number;
    NOMBRE_ZONA: string;
    MUNICIPIO_ASIGNADO: number;
    LIDER_ZONA: number | null;
    NOMBRE_MUNICIPIO: string; // Obtenido via JOIN
    NOMBRE_LIDER: string; // Obtenido via JOIN
}

interface Municipio {
    ID_MUNICIPIO: number;
    NOMBRE_MUNICIPIO: string;
}

interface Usuario {
    ID_USUARIO: number;
    NOMBRE_USUARIO: string;
    APELLIDO_USUARIO: string;
    NIVEL_LIDERAZGO: 'DEPARTAMENTO' | 'MUNICIPIO' | 'ZONA' | null; // <-- CAMBIO
}

interface FormState {
    nombre_zona: string;
    municipio_asignado: string;
    lider_zona: string;
}

const ZoneManagement: React.FC = () => {
    // --- Estados ---
    const [form, setForm] = useState<FormState>({
        nombre_zona: "",
        municipio_asignado: "",
        lider_zona: ""
    });

    const [zonas, setZonas] = useState<Zona[]>([]);
    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);

    const [loading, setLoading] = useState(false);
    const [loadingZonas, setLoadingZonas] = useState(true);
    const [loadingMunicipios, setLoadingMunicipios] = useState(true);
    const [loadingUsuarios, setLoadingUsuarios] = useState(true);
    const [saved, setSaved] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                // <-- CAMBIO: Usar el nuevo endpoint
                const response = await fetch("https://datainsightscloud.com/Apis/usuarios_disponibles.php");
                const data = await response.json();
                if (data?.success && Array.isArray(data.data)) {
                    setUsuarios(data.data);
                } else {
                    toast.error("Error al cargar la lista de usuarios para líderes");
                }
            } catch (error) {
                toast.error("Error de conexión al cargar usuarios");
                console.error("Error fetching usuarios:", error);
            } finally {
                setLoadingUsuarios(false);
            }
        };
        fetchUsuarios();
    }, []);


    useEffect(() => {
        const fetchZonas = async () => {
            try {
                const response = await fetch("https://datainsightscloud.com/Apis/zona_list.php");
                const data = await response.json();
                if (data?.success && Array.isArray(data.data)) {
                    setZonas(data.data);
                } else {
                    toast.error("Error al cargar las zonas");
                }
            } catch (error) {
                toast.error("Error de conexión al cargar zonas");
                console.error("Error fetching zonas:", error);
            } finally {
                setLoadingZonas(false);
            }
        };
        fetchZonas();
    }, []);

    useEffect(() => {
        const fetchMunicipios = async () => {
            try {
                // <-- CAMBIO: Usar el nuevo endpoint para opciones
                const response = await fetch("https://datainsightscloud.com/Apis/mncpio_options.php");
                const data = await response.json();
                if (data?.success && Array.isArray(data.data)) {
                    setMunicipios(data.data);
                } else {
                    toast.error("Error al cargar los municipios");
                }
            } catch (error) {
                toast.error("Error de conexión al cargar municipios");
                console.error("Error fetching municipios:", error);
            } finally {
                setLoadingMunicipios(false);
            }
        };
        fetchMunicipios();
    }, []);

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const response = await fetch("https://datainsightscloud.com/Apis/usuario_sistema.php");
                const data = await response.json();
                if (data?.success && Array.isArray(data.data)) {
                    setUsuarios(data.data);
                } else {
                    toast.error("Error al cargar la lista de usuarios para líderes");
                }
            } catch (error) {
                toast.error("Error de conexión al cargar usuarios");
                console.error("Error fetching usuarios:", error);
            } finally {
                setLoadingUsuarios(false);
            }
        };
        fetchUsuarios();
    }, []);

    // --- Manejadores de Eventos ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEdit = (zona: Zona) => {
        setForm({
            nombre_zona: zona.NOMBRE_ZONA,
            municipio_asignado: zona.MUNICIPIO_ASIGNADO.toString(),
            lider_zona: zona.LIDER_ZONA?.toString() || ""
        });
        setEditingId(zona.ID_ZONA);
    };


    const resetForm = () => {
        setForm({ nombre_zona: "", municipio_asignado: "", lider_zona: "" });
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!form.nombre_zona || !form.municipio_asignado) {
            return toast.error("El nombre y el municipio son obligatorios");
        }
        setLoading(true);
        try {
            const url = editingId
                ? `https://datainsightscloud.com/Apis/zona_update.php?id=${editingId}`
                : "https://datainsightscloud.com/Apis/zona_create.php";
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await response.json();
            if (data.success) {
                toast.success(editingId ? "Zona actualizada" : "Zona guardada");
                setSaved(true); setTimeout(() => setSaved(false), 3000);
                resetForm();
                const responseZonas = await fetch("https://datainsightscloud.com/Apis/zona_list.php");
                const dataZonas = await responseZonas.json();
                if (dataZonas?.success && Array.isArray(dataZonas.data)) {
                    setZonas(dataZonas.data);
                }
            } else {
                toast.error(data.message || "Error al guardar la zona");
            }
        } catch (error) {
            toast.error("Error de conexión");
            console.error("Error saving zone:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredZonas = zonas.filter(zona => {
        const nombre = zona.NOMBRE_ZONA.toLowerCase();
        const municipio = zona.NOMBRE_MUNICIPIO.toLowerCase();
        const lider = zona.NOMBRE_LIDER.toLowerCase();
        return nombre.includes(searchTerm.toLowerCase()) || municipio.includes(searchTerm.toLowerCase()) || lider.includes(searchTerm.toLowerCase());
    });

    // --- Renderizado JSX ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Gestión de Zonas</h1>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Formulario */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {editingId ? "Editar Zona" : "Registrar Nueva Zona"}
                            </h2>
                            {editingId && <button onClick={resetForm} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"><X className="w-4 h-4 text-gray-600" /></button>}
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Zona</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Map className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <input type="text" name="nombre_zona" value={form.nombre_zona} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Hipódromo" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Municipio Asignado</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <select name="municipio_asignado" value={form.municipio_asignado} onChange={handleChange} disabled={loadingMunicipios} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                                        <option value="">{loadingMunicipios ? "Cargando..." : "Seleccionar municipio"}</option>
                                        {municipios.map(municipio => (<option key={municipio.ID_MUNICIPIO} value={municipio.ID_MUNICIPIO.toString()}>{municipio.NOMBRE_MUNICIPIO}</option>))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Líder Asignado</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <select
                                        name="lider_zona"
                                        value={form.lider_zona}
                                        onChange={handleChange}
                                        disabled={loadingUsuarios}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                    >
                                        <option value="">{loadingUsuarios ? "Cargando líderes..." : "Seleccionar un líder"}</option>
                                        {usuarios
                                            .filter(usuario =>
                                                // Permitir usuarios que NO son líderes de departamento ni de municipio
                                                (usuario.NIVEL_LIDERAZGO !== 'DEPARTAMENTO' && usuario.NIVEL_LIDERAZGO !== 'MUNICIPIO') ||
                                                // Si estamos editando, mantener al líder actual en la lista
                                                (editingId !== null && parseInt(form.lider_zona) === usuario.ID_USUARIO)
                                            )
                                            .map(usuario => (
                                                <option key={usuario.ID_USUARIO} value={usuario.ID_USUARIO.toString()}>
                                                    {usuario.NOMBRE_USUARIO} {usuario.APELLIDO_USUARIO}
                                                </option>
                                            ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className={`w-full py-2 px-4 rounded-lg font-medium text-white flex items-center justify-center transition-colors ${saved ? "bg-green-500 hover:bg-green-600" : loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
                                {saved ? (<> <Check className="w-4 h-4 mr-2" /> Guardado </>) : loading ? (<> <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> Guardando... </>) : (<> <Save className="w-4 h-4 mr-2" /> {editingId ? "Actualizar Zona" : "Guardar Zona"} </>)}
                            </button>
                        </form>
                    </div>
                    {/* Tabla de Zonas */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">Zonas Registradas</h2>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="w-4 h-4 text-gray-400" />
                                </div>
                                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar..." className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                        {loadingZonas ? (<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead><tr className="border-b border-gray-200"><th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Nombre</th><th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Municipio</th><th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Líder</th><th className="text-center py-2 px-2 text-sm font-medium text-gray-700">Acciones</th></tr></thead>
                                    <tbody>
                                        {filteredZonas.length === 0 ? (<tr><td colSpan={4} className="text-center py-8 text-gray-500">No se encontraron zonas</td></tr>) : (
                                            filteredZonas.map(zona => (
                                                <tr key={zona.ID_ZONA} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-2 text-sm font-medium text-gray-900">{zona.NOMBRE_ZONA}</td>
                                                    <td className="py-3 px-2 text-sm text-gray-700">{zona.NOMBRE_MUNICIPIO}</td>
                                                    <td className="py-3 px-2 text-sm text-gray-700">{zona.NOMBRE_LIDER || "No asignado"}</td>
                                                    <td className="py-3 px-2">
                                                        <div className="flex justify-center space-x-1">
                                                            <button onClick={() => handleEdit(zona)} className="p-1 rounded-full bg-blue-100 hover:bg-blue-200" title="Editar"><Edit2 className="w-4 h-4 text-blue-600" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ZoneManagement;