import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Save, Phone, MapPin, Shield, ShieldOff, Check, Edit2, Search, X,  ArrowLeft, Mail, Lock,   Info, Users } from "lucide-react";
import MunicipiosAdepartamentos from '../data/municipiosAdepartamentos';

// ... (Los interfaces y los componentes AuthError y AccessDenied permanecen igual) ...

interface Departamento {
    ID_DPTO: number;
    NOMBRE_DPTO: string;
}

interface Usuario {
    ID_USUARIO: number;
    NOMBRE_USUARIO: string;
    APELLIDO_USUARIO: string;
    TELEFONO_USUARIO: string;
    ROL_USUARIO: string; // Este es un string (ej: "LIDER", "1", "2")
    ESTADO_USUARIO: number;
    ZONA_ASIGNADA: number;
    NOMBRE_ZONA: string;
    CORREO_USUARIO?: string;
}

interface CurrentUser {
    id: number;
    role: number;
    rol_usuario: string | null; // Puede ser "LIDER", "1", "2", etc.
    zonaAsignada: number | null;
    nombreZona: string | null;
    nombre: string | null;
}

interface FormState {
    nombre_usuario: string;
    apellido_usuario: string;
    telefono_usuario: string;
    rol_usuario: string;
    estado_usuario: string;
    dpto_asignado: string;
    municipio_asignado: string;
    correo_usuario: string;
    contrasena_usuario: string;
}

// Componente para mostrar errores de autenticación
const AuthError: React.FC<{ message: string }> = ({ message }) => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-md w-full text-center">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-red-100 to-orange-100 mb-6">
                    <Info className="h-10 w-10 text-red-600" />
                </div>
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-orange-600 mb-3">
                    Error de Autenticación
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    {message}
                </p>
                <button 
                    onClick={() => navigate("/Admin_gold")}
                    className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" /> 
                    Ir al Inicio de Sesión
                </button>
            </div>
        </div>
    );
};


// Componente de Acceso Denegado (para roles no permitidos)
const AccessDenied: React.FC = () => {
    const navigate = useNavigate();
    const handleRedirectToDashboard = () => {
        navigate("/Dash-Resumen-votantes"); 
    };
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-md w-full text-center">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-6">
                    <ShieldOff className="h-10 w-10 text-indigo-600" />
                </div>
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3">
                    Acceso Restringido
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    ¡Ups! Parece que no tienes permisos para acceder a esta página. 
                    Tu rol de usuario actual no permite ver esta sección. Si crees que esto es un error, contacta al administrador.
                </p>
                <button 
                    onClick={handleRedirectToDashboard}
                    className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" /> 
                    Volver al Inicio
                </button>
            </div>
        </div>
    );
}; 

// Línea añadida para simular el uso del componente y eliminar el error de TypeScript
console.log(AccessDenied); 



// INICIO - NUEVO COMPONENTE PARA LÍDERES
const LeaderView: React.FC<{ userName: string | undefined }> = ({ userName }) => {
    const navigate = useNavigate();
    const handleRedirectToDashboard = () => {
        navigate("/dashboard"); 
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 max-w-md w-full text-center">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-teal-100 to-blue-100 mb-6">
                    <Users className="h-10 w-10 text-teal-600" />
                </div>
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600 mb-3">
                    ¡Hola, {userName || 'Lider'}!
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    Tu rol como líder es fundamental para el éxito del equipo. Esta sección está destinada a la administración general de usuarios.
                    Para gestionar a tus votantes y ver tu progreso, por favor, regresa al panel principal.
                </p>
                <button 
                    onClick={handleRedirectToDashboard}
                    className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" /> 
                    Ir a mi Panel
                </button>
            </div>
        </div>
    );
};
// FIN - NUEVO COMPONENTE

// Funciones para manejo del Token JWT
const getToken = () => {
    const token = localStorage.getItem('token');
    console.log("Token encontrado en storage:", token ? "Sí" : "No");
    return token;
};

const getCurrentUserInfo = (): CurrentUser | null => {
    const token = getToken();
    if (!token) {
        console.error("Error de autenticación: No se encontró ningún token.");
        return null;
    }
    
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) {
            throw new Error("El token no tiene un payload válido.");
        }
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        console.log("Payload del token decodificado:", payload);

        return {
            id: payload.sub,
            role: payload.tipo_usuario,
            rol_usuario: payload.rol_usuario ? String(payload.rol_usuario) : null,
            zonaAsignada: payload.zona_asignada ? Number(payload.zona_asignada) : null,
            nombreZona: payload.nombre_zona,
            nombre: payload.nombre || 'Usuario'
        };
    } catch (error) {
        console.error('Error al decodificar el token JWT:', error);
        return null;
    }
};


const UserManagement: React.FC = () => {
    const navigate = useNavigate();
    
    // --- TODOS LOS HOOKS AL PRINCIPIO ---
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>({
        nombre_usuario: "",
        apellido_usuario: "",
        telefono_usuario: "",
        rol_usuario: "",
        estado_usuario: "1",
        dpto_asignado: "",
        municipio_asignado: "",
        correo_usuario: "",
        contrasena_usuario: ""
    });
    const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
    const [departamentosFiltrados, setDepartamentosFiltrados] = useState<Departamento[]>([]);
    const [municipiosFiltrados, setMunicipiosFiltrados] = useState<string[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingDepartamentos, setLoadingDepartamentos] = useState(true);

    console.log(loadingDepartamentos); 

    
    const [loadingUsuarios, setLoadingUsuarios] = useState(true);
    const [saved, setSaved] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    // Estado 'mostrarSoloMiZona' eliminado, ya que ahora es el comportamiento por defecto para los roles que lo necesitan.

    // --- LÓGICA DE EFECTOS ---
    useEffect(() => {
        console.log("useEffect de autenticación se está ejecutando...");
        const userInfo = getCurrentUserInfo();
        if (userInfo) {
            console.log("Usuario autenticado:", userInfo);
            setCurrentUser(userInfo);
        } else {
            console.error("La información del usuario no se pudo obtener. Mostrando error de autenticación.");
            setAuthError("No se pudo verificar tu identidad. Por favor, inicia sesión nuevamente.");
        }
    }, [navigate]);

    useEffect(() => {
        const fetchDepartamentos = async () => {
            try {
                const response = await fetch(`https://devsoul.co/api_votantes/dpto_options.php`);
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

    // <-- CAMBIO REALIZADO: Mostrar todos los departamentos si el rol es '2'
    useEffect(() => {
        if (departamentos.length > 0) {
            if (currentUser?.rol_usuario === '2') {
                // Para el rol '2', mostrar todos los departamentos
                setDepartamentosFiltrados(departamentos);
            } else if (currentUser?.nombreZona) {
                // Para otros roles, mostrar solo el departamento del usuario
                const deptoDelUsuario = departamentos.filter(
                    dpto => dpto.NOMBRE_DPTO === currentUser.nombreZona
                );
                setDepartamentosFiltrados(deptoDelUsuario);

                if (deptoDelUsuario.length === 1) {
                    setForm(prev => ({ 
                        ...prev, 
                        dpto_asignado: deptoDelUsuario[0].ID_DPTO.toString() 
                    }));
                }
            } else {
                // Si no hay rol '2' ni nombre de zona, no mostrar nada
                setDepartamentosFiltrados([]);
            }
        }
    }, [departamentos, currentUser?.nombreZona, currentUser?.rol_usuario]);

    useEffect(() => {
        if (form.dpto_asignado && departamentos.length > 0) {
            const departamentoSeleccionado = departamentos.find(dpto => dpto.ID_DPTO.toString() === form.dpto_asignado);
            
            if (departamentoSeleccionado) {
                const nombreDeptoNormalizado = departamentoSeleccionado.NOMBRE_DPTO.toLowerCase().trim();
                const municipiosDelDepto = Object.entries(MunicipiosAdepartamentos)
                    .filter(([, depto]) => depto.toLowerCase().trim() === nombreDeptoNormalizado)
                    .map(([municipio]) => municipio);
                setMunicipiosFiltrados(municipiosDelDepto);
                
            } else {
                setMunicipiosFiltrados([]);
            }
        } else {
            setMunicipiosFiltrados([]);
        }
    }, [form.dpto_asignado, departamentos]);

    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                const response = await fetch("https://devsoul.co/api_votantes/usuario_sistema.php");
                const data = await response.json();
                if (data?.success && Array.isArray(data.data)) {
                    setUsuarios(data.data);
                } else {
                   // constant toast.error("Error al cargar los usuarios");
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
    
    // --- LÓGICA DE MANEJADORES Y FUNCIONES ---
    const handleRedirectToUsuarios = () => {
        navigate("/dashboard");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        setForm(prev => {
            const newForm = { ...prev, [name]: value };
            if (name === 'dpto_asignado') {
                newForm.municipio_asignado = "";
            }
            return newForm;
        });
    };

    const handleEdit = (usuario: Usuario) => {
        const deptoId = departamentos.find(d => d.NOMBRE_DPTO === usuario.NOMBRE_ZONA)?.ID_DPTO.toString() || "";
        setForm({
            nombre_usuario: usuario.NOMBRE_USUARIO,
            apellido_usuario: usuario.APELLIDO_USUARIO,
            telefono_usuario: usuario.TELEFONO_USUARIO,
            rol_usuario: usuario.ROL_USUARIO,
            estado_usuario: usuario.ESTADO_USUARIO.toString(),
            dpto_asignado: deptoId,
            municipio_asignado: "",
            correo_usuario: usuario.CORREO_USUARIO || "",
            contrasena_usuario: "" 
        });
        setEditingId(usuario.ID_USUARIO);
    };

    const resetForm = () => {
        const defaultDeptoId = departamentosFiltrados.length > 0 ? departamentosFiltrados[0].ID_DPTO.toString() : "";
        setForm({
            nombre_usuario: "",
            apellido_usuario: "",
            telefono_usuario: "",
            rol_usuario: "",
            estado_usuario: "1",
            dpto_asignado: defaultDeptoId,
            municipio_asignado: "",
            correo_usuario: "",
            contrasena_usuario: ""
        });
        setEditingId(null);
        setMunicipiosFiltrados([]);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!form.nombre_usuario || !form.apellido_usuario || !form.telefono_usuario || !form.dpto_asignado || !form.municipio_asignado) {
            return toast.error("Todos los campos son obligatorios");
        }
        if (!form.contrasena_usuario) {
            return toast.error("La contraseña es obligatoria");
        }
        if (form.correo_usuario) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(form.correo_usuario)) {
                return toast.error("Por favor, ingrese un correo electrónico válido");
            }
        }
        setLoading(true);
        try {
            const url = editingId
                ? `https://devsoul.co/api_votantes/usuario_update.php?id=${editingId}`
                : "https://devsoul.co/api_votantes/usuario_create.php";
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || "Error al guardar el usuario");
            }
            toast.success(editingId ? "Usuario actualizado correctamente" : "Usuario guardado correctamente");
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            resetForm();
            const responseUsuarios = await fetch("https://devsoul.co/api_votantes/usuario_sistema.php");
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

    // --- MODIFICACIÓN PRINCIPAL AQUÍ ---
    const filteredUsuarios = useMemo(() => {
        let usuariosFiltradosPorRol = usuarios;

        // Caso 1: Super Admin (rol '2')
        if (currentUser?.rol_usuario === '2') {
            // El Super Admin ve a todos los usuarios. No se necesita filtrar por zona ni rol.
        }
        // Caso 2: Cualquier otro rol que tenga una zona asignada (incluye al rol '1')
        else if (currentUser?.zonaAsignada) {
            // El Admin de Departamento y otros roles ven solo a la gente de su zona asignada.
            usuariosFiltradosPorRol = usuarios.filter(u => u.ZONA_ASIGNADA === currentUser.zonaAsignada);
        } else {
            // Si el usuario no tiene zona asignada (y no es Super Admin), no ve nada.
            usuariosFiltradosPorRol = [];
        }

        // --- NUEVO: Siempre excluir a los Super Admins (ROL_USUARIO === '2') de la lista visible ---
        usuariosFiltradosPorRol = usuariosFiltradosPorRol.filter(u => u.ROL_USUARIO !== '2');

        // Aplicar el filtro de búsqueda sobre el resultado anterior
        return usuariosFiltradosPorRol.filter(usuario => {
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
    }, [usuarios, currentUser, searchTerm]);


    // --- RENDERIZADO CONDICIONAL AL FINAL ---
    if (authError) {
        return <AuthError message={authError} />;
    }

    if (currentUser === null) {
        return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

     // <-- CORRECCIÓN: Mostrar vista específica para LÍDERES
    if (currentUser.rol_usuario === 'LIDER') {
        return <LeaderView userName={currentUser.nombre || undefined} />;
    }

    // RENDERIZADO PRINCIPAL: Solo para roles permitidos (ej. Administradores)
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
                    <div className="flex space-x-3">
                        <button onClick={handleRedirectToUsuarios} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                            <ArrowLeft className="w-5 h-5 mr-2" /> Regresar
                        </button>
                    
                    </div>
                </div>

                {currentUser.nombre && (
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="mr-4">
                                    <p className="text-sm text-gray-500">Usuario actual</p>
                                    <p className="text-lg font-semibold text-gray-800">{currentUser.nombre}</p>
                                </div>
                                <div className="mr-4">
                                    <p className="text-sm text-gray-500">Zona asignada</p>
                                    <p className="text-lg font-semibold text-gray-800">{currentUser.nombreZona}</p>
                                </div>
                            </div>
                            {/* El botón de filtro ya no es necesario para ningún rol */}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">{editingId ? "Editar Usuario" : "Registrar Nuevo Usuario"}</h2>
                            {editingId && <button onClick={resetForm} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"><X className="w-4 h-4 text-gray-600" /></button>}
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                    <input type="text" name="nombre_usuario" value={form.nombre_usuario} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Jhonathan" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                                    <input type="text" name="apellido_usuario" value={form.apellido_usuario} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ramirez" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="w-4 h-4 text-gray-400" /></div><input type="tel" name="telefono_usuario" value={form.telefono_usuario} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="3006078260" /></div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Shield className="w-4 h-4 text-gray-400" /></div><select name="rol_usuario" value={form.rol_usuario} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"><option value="">Seleccionar rol</option><option value="LIDER">Lider</option>{/* <-- CAMBIO REALIZADO */}{(currentUser.rol_usuario === '1' || currentUser.rol_usuario === '2') && <option value="1">Lider Departamento</option>}</select><div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div></div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Check className="w-4 h-4 text-gray-400" /></div><select name="estado_usuario" value={form.estado_usuario} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"><option value="1">Activo</option><option value="0">Inactivo</option></select><div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-9"></path></svg></div></div>
                            </div>
                            
                            {departamentosFiltrados.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MapPin className="w-4 h-4 text-gray-400" /></div>
                                        <select name="dpto_asignado" value={form.dpto_asignado} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none">
                                            {departamentosFiltrados.map(departamento => (<option key={departamento.ID_DPTO} value={departamento.ID_DPTO.toString()}>{departamento.NOMBRE_DPTO}</option>))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-9"></path></svg></div>
                                    </div>
                                </div>
                            )}

                            {form.dpto_asignado && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><MapPin className="w-4 h-4 text-gray-400" /></div>
                                        <select name="municipio_asignado" value={form.municipio_asignado} onChange={handleChange} disabled={!form.dpto_asignado || municipiosFiltrados.length === 0} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none disabled:bg-gray-100">
                                            <option value="">{!form.dpto_asignado ? "Seleccione primero un departamento" : municipiosFiltrados.length === 0 ? "No hay municipios disponibles para este depto." : "Seleccionar municipio"}</option>
                                            {municipiosFiltrados.map(municipio => (<option key={municipio} value={municipio}>{municipio}</option>))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-9"></path></svg></div>
                                    </div>
                                </div>
                            )}
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="w-4 h-4 text-gray-400" /></div><input type="email" name="correo_usuario" value={form.correo_usuario} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="correo@ejemplo.com" /></div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Lock className="w-4 h-4 text-gray-400" /></div><input type="password" name="contrasena_usuario" value={form.contrasena_usuario} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Contraseña" required /></div>
                            </div>
                            <button type="submit" disabled={loading} className={`w-full py-2 px-4 rounded-lg font-medium text-white flex items-center justify-center transition-colors ${saved ? "bg-green-500 hover:bg-green-600" : loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
                                {saved ? (<> <Check className="w-4 h-4 mr-2" /> Guardado </>) : loading ? (<> <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg> Guardando... </>) : (<> <Save className="w-4 h-4 mr-2" /> {editingId ? "Actualizar Usuario" : "Guardar Usuario"} </>)}
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">Usuarios Registrados</h2>
                            <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="w-4 h-4 text-gray-400" /></div><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar usuarios..." className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
                        </div>
                        {loadingUsuarios ? (<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>) : (<div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-200"><th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Nombre</th><th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Teléfono</th><th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Rol</th><th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Estado</th><th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Zona</th><th className="text-center py-2 px-2 text-sm font-medium text-gray-700">Acciones</th></tr></thead><tbody>{filteredUsuarios.length === 0 ? (<tr><td colSpan={6} className="text-center py-8 text-gray-500">No se encontraron usuarios</td></tr>) : (filteredUsuarios.map(usuario => (<tr key={usuario.ID_USUARIO} className="border-b border-gray-100 hover:bg-gray-50"><td className="py-3 px-2"><div><div className="text-sm font-medium text-gray-900">{usuario.NOMBRE_USUARIO} {usuario.APELLIDO_USUARIO}</div></div></td><td className="py-3 px-2 text-sm text-gray-700">{usuario.TELEFONO_USUARIO}</td>{/* --- CAMBIO AQUÍ: Mostrar "Lider Departamento" para el rol '1' --- */}<td className="py-3 px-2 text-sm text-gray-700">{usuario.ROL_USUARIO === '1' ? 'Lider Departamento' : usuario.ROL_USUARIO}</td><td className="py-3 px-2"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${usuario.ESTADO_USUARIO === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{usuario.ESTADO_USUARIO === 1 ? "Activo" : "Inactivo"}</span></td><td className="py-3 px-2 text-sm text-gray-700">{usuario.NOMBRE_ZONA}</td><td className="py-3 px-2"><div className="flex justify-center space-x-1"><button onClick={() => handleEdit(usuario)} className="p-1 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors" title="Editar"><Edit2 className="w-4 h-4 text-blue-600" /></button></div></td></tr>)))}</tbody></table></div>)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;