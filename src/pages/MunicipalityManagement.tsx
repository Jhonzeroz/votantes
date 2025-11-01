import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, User, MapPin, Check, Edit2, Search, X, Building2, ArrowLeft } from "lucide-react";

// --- Definición de Tipos ---

interface Municipio {
    ID_MUNICIPIO: number;
    NOMBRE_MUNICIPIO: string;
    DPTO_ASIGNADO: number;
    LIDER_MUNICIPIO: number | null;
    NOMBRE_DPTO: string; // Obtenido via JOIN
    NOMBRE_LIDER: string; // Obtenido via JOIN
}

interface Departamento {
    ID_DPTO: number;
    NOMBRE_DPTO: string;
}

interface Usuario {
    ID_USUARIO: number;
    NOMBRE_USUARIO: string;
    APELLIDO_USUARIO: string;
    NIVEL_LIDERAZGO: 'DEPARTAMENTO' | 'MUNICIPIO' | 'ZONA' | null;
}

interface FormState {
    nombre_municipio: string;
    dpto_asignado: string;
    lider_municipio: string;
}

const MunicipalityManagement: React.FC = () => {
    // --- Estados ---
    const [form, setForm] = useState<FormState>({
        nombre_municipio: "",
        dpto_asignado: "",
        lider_municipio: ""
    });

    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]); // Usuarios disponibles para ser líderes

    const [loading, setLoading] = useState(false);
    const [loadingMunicipios, setLoadingMunicipios] = useState(true);
    const [loadingDepartamentos, setLoadingDepartamentos] = useState(true);
    const [loadingUsuarios, setLoadingUsuarios] = useState(true);
    const [saved, setSaved] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    const handleRedirectToUsuarios = () => {
        window.location.href = "/dashboard";
    };

    // --- Efectos para cargar datos iniciales ---

    // Cargar Departamentos
    useEffect(() => {
        const fetchDepartamentos = async () => {
            try {
                const response = await fetch("https://datainsightscloud.com/Apis/dpto_options.php");
                const data = await response.json();
                if (data?.success && Array.isArray(data.data)) {
                    setDepartamentos(data.data);
                } else {
                    toast.error("Error al cargar los departamentos");
                }
            } catch (error) {
                toast.error("Error de conexión al cargar departamentos");
                console.error("Error fetching departamentos:", error);
            } finally {
                setLoadingDepartamentos(false);
            }
        };
        fetchDepartamentos();
    }, []);

    // Cargar Municipios
    useEffect(() => {
        const fetchMunicipios = async () => {
            try {
                const response = await fetch("https://datainsightscloud.com/Apis/mncpio_list.php");
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

    // Cargar Usuarios Disponibles para Líderes
    // CORRECCIÓN: Se elimina el useEffect duplicado. Solo se llama al endpoint correcto.
    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                // Este endpoint debería devolver la lista de usuarios que pueden ser líderes de municipio.
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
    }, []); // Se ejecuta solo una vez al montar el componente

    // --- Manejadores de Eventos ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEdit = (municipio: Municipio) => {
        setForm({
            nombre_municipio: municipio.NOMBRE_MUNICIPIO,
            dpto_asignado: municipio.DPTO_ASIGNADO.toString(),
            lider_municipio: municipio.LIDER_MUNICIPIO?.toString() || ""
        });
        setEditingId(municipio.ID_MUNICIPIO);
    };

    const resetForm = () => {
        setForm({ nombre_municipio: "", dpto_asignado: "", lider_municipio: "" });
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!form.nombre_municipio || !form.dpto_asignado) {
            return toast.error("El nombre y el departamento son obligatorios");
        }
        setLoading(true);
        try {
            const url = editingId
                ? `https://datainsightscloud.com/Apis/mncpio_update.php?id=${editingId}`
                : "https://datainsightscloud.com/Apis/mncpio_create.php";
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await response.json();
            if (data.success) {
                toast.success(editingId ? "Municipio actualizado" : "Municipio guardado");
                setSaved(true); setTimeout(() => setSaved(false), 3000);
                resetForm();
                // Refrescar la lista de municipios
                const responseMunicipios = await fetch("https://datainsightscloud.com/Apis/mncpio_list.php");
                const dataMunicipios = await responseMunicipios.json();
                if (dataMunicipios?.success && Array.isArray(dataMunicipios.data)) {
                    setMunicipios(dataMunicipios.data);
                }
            } else {
                toast.error(data.message || "Error al guardar el municipio");
            }
        } catch (error) {
            toast.error("Error de conexión");
            console.error("Error saving municipality:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredMunicipios = municipios.filter(municipio => {
        const nombre = municipio.NOMBRE_MUNICIPIO.toLowerCase();
        const dpto = municipio.NOMBRE_DPTO.toLowerCase();
        const lider = municipio.NOMBRE_LIDER.toLowerCase();
        const term = searchTerm.toLowerCase();
        return nombre.includes(term) || dpto.includes(term) || lider.includes(term);
    });

    // --- Renderizado JSX ---
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Gestión de Municipios</h1>
                    <button
                        onClick={handleRedirectToUsuarios}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Regresar
                    </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Formulario */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {editingId ? "Editar Municipio" : "Registrar Nuevo Municipio"}
                            </h2>
                            {editingId && <button onClick={resetForm} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"><X className="w-4 h-4 text-gray-600" /></button>}
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Municipio</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <input type="text" name="nombre_municipio" value={form.nombre_municipio} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Soledad" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento Asignado</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Building2 className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <select name="dpto_asignado" value={form.dpto_asignado} onChange={handleChange} disabled={loadingDepartamentos} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none">
                                        <option value="">{loadingDepartamentos ? "Cargando..." : "Seleccionar departamento"}</option>
                                        {departamentos.map(dpto => (<option key={dpto.ID_DPTO} value={dpto.ID_DPTO.toString()}>{dpto.NOMBRE_DPTO}</option>))}
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
                                        name="lider_municipio"
                                        value={form.lider_municipio}
                                        onChange={handleChange}
                                        disabled={loadingUsuarios}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                    >
                                        <option value="">{loadingUsuarios ? "Cargando líderes..." : "Seleccionar un líder"}</option>
                                        {/* CORRECCIÓN: Se simplifica el mapeo. Se asume que la API ya filtra los usuarios correctos. */}
                                        {usuarios.map(usuario => (
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
                                {saved ? (<> <Check className="w-4 h-4 mr-2" /> Guardado </>) : loading ? (<> <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> Guardando... </>) : (<> <Save className="w-4 h-4 mr-2" /> {editingId ? "Actualizar Municipio" : "Guardar Municipio"} </>)}
                            </button>
                        </form>
                    </div>
                    {/* Tabla de Municipios */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">Municipios Registrados</h2>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="w-4 h-4 text-gray-400" />
                                </div>
                                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar..." className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>
                        {loadingMunicipios ? (<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead><tr className="border-b border-gray-200"><th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Nombre</th><th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Departamento</th><th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Líder</th><th className="text-center py-2 px-2 text-sm font-medium text-gray-700">Acciones</th></tr></thead>
                                    <tbody>
                                        {filteredMunicipios.length === 0 ? (<tr><td colSpan={4} className="text-center py-8 text-gray-500">No se encontraron municipios</td></tr>) : (
                                            filteredMunicipios.map(municipio => (
                                                <tr key={municipio.ID_MUNICIPIO} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-2 text-sm font-medium text-gray-900">{municipio.NOMBRE_MUNICIPIO}</td>
                                                    <td className="py-3 px-2 text-sm text-gray-700">{municipio.NOMBRE_DPTO}</td>
                                                    <td className="py-3 px-2 text-sm text-gray-700">{municipio.NOMBRE_LIDER || "No asignado"}</td>
                                                    <td className="py-3 px-2">
                                                        <div className="flex justify-center space-x-1">
                                                            <button onClick={() => handleEdit(municipio)} className="p-1 rounded-full bg-blue-100 hover:bg-blue-200" title="Editar"><Edit2 className="w-4 h-4 text-blue-600" /></button>
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

export default MunicipalityManagement;