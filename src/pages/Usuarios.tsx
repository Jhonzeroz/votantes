import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Phone, MapPin, Shield, Check, Edit2, Search, X, UserPlus, ArrowLeft, Mail, Lock } from "lucide-react";

// Definimos los tipos para TypeScript
interface Zona {
    id: number;
    nombre: string;
}

interface Municipio {
    id: number;
    nombre: string;
    id_zona: number;
}

interface Usuario {
    ID_USUARIO: number;
    NOMBRE_USUARIO: string;
    APELLIDO_USUARIO: string;
    TELEFONO_USUARIO: string;
    ROL_USUARIO: string;
    ESTADO_USUARIO: number;
    ZONA_ASIGNADA: number;
    NOMBRE_ZONA: string;
    CORREO_USUARIO?: string;
}

interface FormState {
    nombre_usuario: string;
    apellido_usuario: string;
    telefono_usuario: string;
    rol_usuario: string;
    estado_usuario: string;
    zona_asignada: string;
    municipio_asignado: string;
    correo_usuario: string;
    contrasena_usuario: string;
}

const UserManagement: React.FC = () => {
    const [form, setForm] = useState<FormState>({
        nombre_usuario: "",
        apellido_usuario: "",
        telefono_usuario: "",
        rol_usuario: "",
        estado_usuario: "1", // Por defecto Activo
        zona_asignada: "",
        municipio_asignado: "",
        correo_usuario: "",
        contrasena_usuario: ""
    });

    const [zonas, setZonas] = useState<Zona[]>([]);
    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingZonas, setLoadingZonas] = useState(true);
    const [loadingMunicipios, setLoadingMunicipios] = useState(false);
    const [loadingUsuarios, setLoadingUsuarios] = useState(true);
    const [saved, setSaved] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Función para redirigir a la página de Usuarios
    const handleRedirectToUsuarios = () => {
        window.location.href = "/dashboard";
    };

    // Cargar zonas desde el API
    useEffect(() => {
        const fetchZonas = async () => {
            try {
                const response = await fetch(`https://datainsightscloud.com/Apis/zonas_list.php?t=${Date.now()}`);
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

    // Cargar municipios cuando se selecciona una zona
    useEffect(() => {
        if (form.zona_asignada) {
            setLoadingMunicipios(true);
            const fetchMunicipios = async () => {
                try {
                    const response = await fetch(`https://datainsightscloud.com/Apis/municipios_list.php?id_zona=${form.zona_asignada}&t=${Date.now()}`);
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
        } else {
            setMunicipios([]);
            setForm(prev => ({ ...prev, municipio_asignado: "" }));
        }
    }, [form.zona_asignada]);

    // Cargar usuarios desde el API
    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const response = await fetch("https://datainsightscloud.com/Apis/usuario_sistema.php");
                const data = await response.json();
                if (data?.success && Array.isArray(data.data)) {
                    setUsuarios(data.data);
                } else {
                    toast.error("Error al cargar los usuarios");
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEdit = (usuario: Usuario) => {
        setForm({
            nombre_usuario: usuario.NOMBRE_USUARIO,
            apellido_usuario: usuario.APELLIDO_USUARIO,
            telefono_usuario: usuario.TELEFONO_USUARIO,
            rol_usuario: usuario.ROL_USUARIO,
            estado_usuario: usuario.ESTADO_USUARIO.toString(),
            zona_asignada: usuario.ZONA_ASIGNADA.toString(),
            municipio_asignado: "",
            correo_usuario: usuario.CORREO_USUARIO || "",
            contrasena_usuario: "" 
        });
        setEditingId(usuario.ID_USUARIO);
    };

    const resetForm = () => {
        setForm({
            nombre_usuario: "",
            apellido_usuario: "",
            telefono_usuario: "",
            rol_usuario: "",
            estado_usuario: "1",
            zona_asignada: "",
            municipio_asignado: "",
            correo_usuario: "",
            contrasena_usuario: ""
        });
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validación básica
        if (!form.nombre_usuario || !form.apellido_usuario || !form.telefono_usuario || !form.zona_asignada) {
            return toast.error("Todos los campos son obligatorios");
        }

        // Validación de contraseña
        if (!form.contrasena_usuario) {
            return toast.error("La contraseña es obligatoria");
        }

        // Validación de email si se proporciona
        if (form.correo_usuario) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(form.correo_usuario)) {
                return toast.error("Por favor, ingrese un correo electrónico válido");
            }
        }

        setLoading(true);

        try {
            // Guardamos el usuario con la API existente
            const url = editingId
                ? `https://datainsightscloud.com/Apis/usuario_update.php?id=${editingId}`
                : "https://datainsightscloud.com/Apis/usuario_create.php";

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || "Error al guardar el usuario");
            }

            // Si todo salió bien, mostramos mensaje de éxito
            toast.success(editingId ? "Usuario actualizado correctamente" : "Usuario guardado correctamente");
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);

            // Resetear formulario
            resetForm();

            // Recargar la lista de usuarios
            const responseUsuarios = await fetch("https://datainsightscloud.com/Apis/usuario_sistema.php");
            const dataUsuarios = await responseUsuarios.json();
            if (dataUsuarios?.success && Array.isArray(dataUsuarios.data)) {
                setUsuarios(dataUsuarios.data);
            }

        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error de conexión");
            console.error("Error saving user:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar usuarios basados en el término de búsqueda
    const filteredUsuarios = usuarios.filter(usuario => {
        const nombre = usuario.NOMBRE_USUARIO || "";
        const apellido = usuario.APELLIDO_USUARIO || "";
        const telefono = usuario.TELEFONO_USUARIO || "";
        const rol = usuario.ROL_USUARIO || "";

        return (
            nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
            telefono.includes(searchTerm) ||
            rol.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
                    <div className="flex space-x-3">
                        <button
                            onClick={handleRedirectToUsuarios}
                            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Regresar
                        </button>
                        <button
                            onClick={handleRedirectToUsuarios}
                            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <UserPlus className="w-5 h-5 mr-2" />
                            Registrar Votante
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Formulario a la izquierda */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">
                                {editingId ? "Editar Usuario" : "Registrar Nuevo Usuario"}
                            </h2>
                            {editingId && (
                                <button
                                    onClick={resetForm}
                                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    <X className="w-4 h-4 text-gray-600" />
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        name="nombre_usuario"
                                        value={form.nombre_usuario}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Jhonathan"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                                    <input
                                        type="text"
                                        name="apellido_usuario"
                                        value={form.apellido_usuario}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Ramirez"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="tel"
                                        name="telefono_usuario"
                                        value={form.telefono_usuario}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="3006078260"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Shield className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <select
                                        name="rol_usuario"
                                        value={form.rol_usuario}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                                    >
                                        <option value="">Seleccionar rol</option>
                                        <option value="LIDER">Lider</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Check className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <select
                                        name="estado_usuario"
                                        value={form.estado_usuario}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                                    >
                                        <option value="1">Activo</option>
                                        <option value="0">Inactivo</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <select
                                        name="zona_asignada"
                                        value={form.zona_asignada}
                                        onChange={handleChange}
                                        disabled={loadingZonas}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                                    >
                                        <option value="">{loadingZonas ? "Cargando..." : "Seleccionar departamento"}</option>
                                        {zonas.map(zona => (
                                            <option key={zona.id} value={zona.id.toString()}>{zona.nombre}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {form.zona_asignada && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <select
                                            name="municipio_asignado"
                                            value={form.municipio_asignado}
                                            onChange={handleChange}
                                            disabled={loadingMunicipios}
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                                        >
                                            <option value="">{loadingMunicipios ? "Cargando..." : "Seleccionar municipio"}</option>
                                            {municipios.map(municipio => (
                                                <option key={municipio.id} value={municipio.id.toString()}>{municipio.nombre}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="correo_usuario"
                                        value={form.correo_usuario}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="correo@ejemplo.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        name="contrasena_usuario"
                                        value={form.contrasena_usuario}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Contraseña"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-2 px-4 rounded-lg font-medium text-white flex items-center justify-center transition-colors ${saved
                                    ? "bg-green-500 hover:bg-green-600"
                                    : loading
                                        ? "bg-blue-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                            >
                                {saved ? (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Guardado
                                    </>
                                ) : loading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        {editingId ? "Actualizar Usuario" : "Guardar Usuario"}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Tabla de usuarios a la derecha */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">Usuarios Registrados</h2>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="w-4 h-4 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar usuarios..."
                                    className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {loadingUsuarios ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Nombre</th>
                                            <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Teléfono</th>
                                            <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Rol</th>
                                            <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Estado</th>
                                            <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Zona</th>
                                            <th className="text-center py-2 px-2 text-sm font-medium text-gray-700">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsuarios.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-8 text-gray-500">
                                                    No se encontraron usuarios
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredUsuarios.map(usuario => (
                                                <tr key={usuario.ID_USUARIO} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-2">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {usuario.NOMBRE_USUARIO} {usuario.APELLIDO_USUARIO}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-2 text-sm text-gray-700">{usuario.TELEFONO_USUARIO}</td>
                                                    <td className="py-3 px-2 text-sm text-gray-700">{usuario.ROL_USUARIO}</td>
                                                    <td className="py-3 px-2">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${usuario.ESTADO_USUARIO === 1
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-red-100 text-red-800"
                                                            }`}>
                                                            {usuario.ESTADO_USUARIO === 1 ? "Activo" : "Inactivo"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-2 text-sm text-gray-700">{usuario.NOMBRE_ZONA}</td>
                                                    <td className="py-3 px-2">
                                                        <div className="flex justify-center space-x-1">
                                                            <button
                                                                onClick={() => handleEdit(usuario)}
                                                                className="p-1 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
                                                                title="Editar"
                                                            >
                                                                <Edit2 className="w-4 h-4 text-blue-600" />
                                                            </button>
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

export default UserManagement;