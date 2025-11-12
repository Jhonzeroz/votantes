import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserPlus, Search, X, Save, Shield, Mail, Lock, Phone, MapPin, Check, ArrowLeft } from "lucide-react";

// --- Interfaces de TypeScript ---
interface Votante {
    ID_VOTANTE: number;
    NUM_DOC: string;
    NOMBRE_COMPLETO: string;
    MESA: number;
    ZONA_NOMBRE: string;
    USUARIO_NOMBRE: string;
    CREADO_EN: string;
}

interface Zona {
    id: number;
    nombre: string;
}

interface EditFormState {
    nombre_usuario: string;
    apellido_usuario: string;
    telefono_usuario: string;
    rol_usuario: string;
    estado_usuario: string;
    zona_asignada: string;
    correo_usuario: string;
    contrasena_usuario: string;
}

// --- Funciones auxiliares para manejo del token y usuario ---
const getToken = () => {
    return localStorage.getItem('token') || getCookie('token');
};

const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
};

const getCurrentUserId = () => {
    const token = getToken();
    if (!token) return null;
    
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        return payload.sub; // Devuelve el ID del usuario
    } catch (error) {
        console.error('Error al decodificar el token JWT:', error);
        return null;
    }
};

const getCurrentUserRole = () => {
    const token = getToken();
    if (!token) return null;
    
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        return payload.tipo_usuario; // Devuelve el tipo de usuario
    } catch (error) {
        console.error('Error al decodificar el token JWT:', error);
        return null;
    }
};


const VotanteManagement: React.FC = () => {
    const navigate = useNavigate();

    // --- Estados para la lista de Votantes ---
    const [votantes, setVotantes] = useState<Votante[]>([]);
    const [loadingVotantes, setLoadingVotantes] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // --- Estados para el Modal de Edición ---
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingVotante, setEditingVotante] = useState<Votante | null>(null);
    const [loadingSave, setLoadingSave] = useState(false);
    const [saved, setSaved] = useState(false);

    // --- Estados para los datos auxiliares (Zonas) ---
    const [zonas, setZonas] = useState<Zona[]>([]);
    const [loadingZonas, setLoadingZonas] = useState(true);
    
    // --- Estado para el usuario actual ---
    const [currentUser, setCurrentUser] = useState<{ id: number; role: number } | null>(null);

    // --- Estado del Formulario ---
    const [form, setForm] = useState<EditFormState>({
        nombre_usuario: "",
        apellido_usuario: "",
        telefono_usuario: "",
        rol_usuario: "LIDER", // Rol por defecto
        estado_usuario: "1", // Activo por defecto
        zona_asignada: "",
        correo_usuario: "",
        contrasena_usuario: ""
    });

    // --- Efecto para obtener el usuario actual al cargar el componente ---
    useEffect(() => {
        const userId = getCurrentUserId();
        const userRole = getCurrentUserRole();
        if (userId && userRole !== null) {
            setCurrentUser({ id: Number(userId), role: Number(userRole) });
        }
    }, []);

    // --- Efectos para cargar datos iniciales ---
    useEffect(() => {
        const fetchZonas = async () => {
            try {
                const response = await fetch(`https://devsoul.co/api_votantes/zonas_list.php?t=${Date.now()}`);
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

        const fetchVotantes = async () => {
            // Si no hay un usuario, no se puede hacer la búsqueda.
            if (!currentUser) return;

            setLoadingVotantes(true);
            try {
                // Construir la URL con el filtro de usuario si no es administrador
                const url = currentUser.role !== 1
                    ? `https://devsoul.co/api_votantes/votantes_list.php?usuario=${currentUser.id}&t=${Date.now()}`
                    : `https://devsoul.co/api_votantes/votantes_list.php?t=${Date.now()}`;

                const response = await fetch(url);
                const data = await response.json();
                if (data?.success && Array.isArray(data.data)) {
                    setVotantes(data.data);
                } else {
                    toast.error("Error al cargar los votantes");
                }
            } catch (error) {
                toast.error("Error de conexión al cargar votantes");
                console.error("Error fetching votantes:", error);
            } finally {
                setLoadingVotantes(false);
            }
        };

        fetchZonas();
        if (currentUser) {
            fetchVotantes();
        }
    }, [currentUser]); // Se ejecuta cuando el usuario actual cambia

    // --- Manejadores de Eventos ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePromote = (votante: Votante) => {
        setEditingVotante(votante);
        setShowEditModal(true);

        const nameParts = votante.NOMBRE_COMPLETO.trim().split(' ');
        const nombre = nameParts[0] || '';
        const apellido = nameParts.slice(1).join(' ') || 'N/A';

        const zona = zonas.find(z => z.nombre === votante.ZONA_NOMBRE);
        const zonaId = zona ? zona.id.toString() : '';

        setForm({
            nombre_usuario: nombre,
            apellido_usuario: apellido,
            telefono_usuario: "",
            rol_usuario: "LIDER",
            estado_usuario: "1",
            zona_asignada: zonaId,
            correo_usuario: "",
            contrasena_usuario: ""
        });
    };

    const handleCloseModal = () => {
        setShowEditModal(false);
        setEditingVotante(null);
        setSaved(false);
        setForm({
            nombre_usuario: "",
            apellido_usuario: "",
            telefono_usuario: "",
            rol_usuario: "LIDER",
            estado_usuario: "1",
            zona_asignada: "",
            correo_usuario: "",
            contrasena_usuario: ""
        });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!form.nombre_usuario || !form.apellido_usuario || !form.telefono_usuario || !form.zona_asignada || !form.contrasena_usuario) {
            return toast.error("Todos los campos son obligatorios");
        }
        
        if (form.correo_usuario) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(form.correo_usuario)) {
                return toast.error("Por favor, ingrese un correo electrónico válido");
            }
        }

        setLoadingSave(true);

        try {
            const response = await fetch("https://devsoul.co/api_votantes/usuario_create.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || "Error al guardar el usuario");
            }

            toast.success("Votante promovido a usuario del sistema correctamente");
            setSaved(true);
            setTimeout(() => {
                handleCloseModal();
            }, 1500);

        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Error de conexión");
            console.error("Error saving user:", error);
        } finally {
            setLoadingSave(false);
        }
    };

    const filteredVotantes = votantes.filter(votante => {
        const searchLower = searchTerm.toLowerCase();
        return (
            votante.NOMBRE_COMPLETO.toLowerCase().includes(searchLower) ||
            votante.NUM_DOC.includes(searchLower) ||
            votante.ZONA_NOMBRE.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Gestión de Votantes</h1>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Volver
                    </button>
                </div>

                <div className="mb-6 flex justify-end">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar votantes..."
                            className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6">
                    {loadingVotantes ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nombre Completo</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Documento</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Registrado por</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredVotantes.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-8 text-gray-500">
                                                No se encontraron votantes asignados a ti.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredVotantes.map(votante => (
                                            <tr key={votante.ID_VOTANTE} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4 text-sm text-gray-900">{votante.NOMBRE_COMPLETO}</td>
                                                <td className="py-3 px-4 text-sm text-gray-700">{votante.NUM_DOC}</td>
                                                <td className="py-3 px-4 text-sm text-gray-700">{votante.USUARIO_NOMBRE}</td>
                                                <td className="py-3 px-4">
                                                    <div className="flex justify-center">
                                                        <button
                                                            onClick={() => handlePromote(votante)}
                                                            className="flex items-center px-3 py-1 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                                                        >
                                                            <UserPlus className="w-4 h-4 mr-1" />
                                                            Promover
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

            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">
                                Promover a Usuario: {editingVotante?.NOMBRE_COMPLETO}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                                    <input
                                        type="text"
                                        name="apellido_usuario"
                                        value={form.apellido_usuario}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="telefono_usuario"
                                        value={form.telefono_usuario}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="3006078260"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        type="email"
                                        name="correo_usuario"
                                        value={form.correo_usuario}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="correo@ejemplo.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <input
                                        type="password"
                                        name="contrasena_usuario"
                                        value={form.contrasena_usuario}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Contraseña"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                <div className="relative">
                                    <Shield className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <select
                                        name="rol_usuario"
                                        value={form.rol_usuario}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                        required
                                    >
                                        <option value="LIDER">Lider</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                    <select
                                        name="zona_asignada"
                                        value={form.zona_asignada}
                                        onChange={handleChange}
                                        disabled={loadingZonas}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                        required
                                    >
                                        <option value="">Seleccionar Departamento</option>
                                        {zonas.map(zona => (
                                            <option key={zona.id} value={zona.id.toString()}>{zona.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loadingSave}
                                className={`w-full py-2 px-4 rounded-lg font-medium text-white flex items-center justify-center transition-colors ${saved
                                    ? "bg-green-500"
                                    : loadingSave
                                        ? "bg-blue-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                            >
                                {saved ? (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Guardado
                                    </>
                                ) : loadingSave ? (
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
                                        Guardar Usuario
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VotanteManagement;