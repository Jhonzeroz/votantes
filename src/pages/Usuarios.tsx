import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Phone, MapPin, Shield, Check, Edit2, Search, X, UserPlus, ArrowLeft, Mail, Lock, Filter, AlertTriangle } from "lucide-react"; // Añadido AlertTriangle
import MunicipiosAdepartamentos from '../data/municipiosAdepartamentos'; // Importamos el objeto de municipios

// Definimos los tipos para TypeScript
interface Departamento {
    ID_DPTO: number;
    NOMBRE_DPTO: string;
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
    dpto_asignado: string;
    municipio_asignado: string;
    correo_usuario: string;
    contrasena_usuario: string;
}

// INICIO - NUEVO COMPONENTE DE ACCESO DENEGADO
const AccessDenied: React.FC = () => {
    const handleRedirectToDashboard = () => {
        // Asegúrate de que esta ruta sea la correcta para tu panel principal
        window.location.href = "/dashboard"; 
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
                <p className="text-gray-600 mb-6">No tienes los permisos necesarios para ver o gestionar usuarios.</p>
                <button 
                    onClick={handleRedirectToDashboard}
                    className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" /> Regresar al Panel
                </button>
            </div>
        </div>
    );
};
// FIN - NUEVO COMPONENTE


const UserManagement: React.FC = () => {
    // INICIO - VERIFICACIÓN DE ROL
    // Obtenemos el rol del usuario desde localStorage. 
    // Asegúrate de guardar el rol con esta clave ('usuarioRol') al iniciar sesión.
    const rolUsuario = localStorage.getItem('usuarioRol');

    // Si el rol no es '2' ni 'LIDER', mostramos el componente de acceso denegado y no renderizamos nada más.
    if (rolUsuario !== '2' && rolUsuario !== 'LIDER') {
        return <AccessDenied />;
    }
    // FIN - VERIFICACIÓN DE ROL

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
    // Nota: El console.log aquí es para depuración, puedes eliminarlo en producción.
    console.log(`Filtrando : ${loadingDepartamentos}`); 
    const [loadingUsuarios, setLoadingUsuarios] = useState(true);
    const [saved, setSaved] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [usuarioLogueado, setUsuarioLogueado] = useState<{
        zonaAsignada: number | null;
        nombreZona: string | null;
        nombre: string | null;
    }>({
        zonaAsignada: null,
        nombreZona: null,
        nombre: null
    });
    
    const [mostrarSoloMiZona, setMostrarSoloMiZona] = useState(true);

    const handleRedirectToUsuarios = () => {
        window.location.href = "/dashboard";
    };

    useEffect(() => {
        const zonaAsignada = localStorage.getItem('zonaAsignada');
        const nombreZona = localStorage.getItem('nombreZona');
        const nombreUsuario = localStorage.getItem('usuarioNombre');
        
        if (zonaAsignada && nombreZona) {
            setUsuarioLogueado({
                zonaAsignada: parseInt(zonaAsignada),
                nombreZona,
                nombre: nombreUsuario
            });
        }
    }, []);

    // Cargar todos los departamentos desde el API
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

    // Filtrar departamentos según el usuario logueado
    useEffect(() => {
        if (departamentos.length > 0 && usuarioLogueado.nombreZona) {
            const deptoDelUsuario = departamentos.filter(
                dpto => dpto.NOMBRE_DPTO === usuarioLogueado.nombreZona
            );
            setDepartamentosFiltrados(deptoDelUsuario);

            // Pre-seleccionar el departamento en el formulario si solo hay uno
            if (deptoDelUsuario.length === 1) {
                setForm(prev => ({ 
                    ...prev, 
                    dpto_asignado: deptoDelUsuario[0].ID_DPTO.toString() 
                }));
            }
        } else {
            setDepartamentosFiltrados([]);
        }
    }, [departamentos, usuarioLogueado.nombreZona]);

// Filtrar municipios cuando se selecciona un departamento
useEffect(() => {
    if (form.dpto_asignado && departamentos.length > 0) {
        const departamentoSeleccionado = departamentos.find(dpto => dpto.ID_DPTO.toString() === form.dpto_asignado);
        
        if (departamentoSeleccionado) {
            const nombreDeptoNormalizado = departamentoSeleccionado.NOMBRE_DPTO.toLowerCase().trim();
            const municipiosDelDepto = Object.entries(MunicipiosAdepartamentos)
                .filter(([municipio, depto]) => {
                    // Simulamos el uso de 'municipio' para evitar la advertencia de TypeScript
                    console.log(`Filtrando  ${municipio}`); 
                    
                    return depto.toLowerCase().trim() === nombreDeptoNormalizado;
                })
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
        
        setForm(prev => {
            const newForm = { ...prev, [name]: value };
            if (name === 'dpto_asignado') {
                newForm.municipio_asignado = "";
            }
            return newForm;
        });
    };

    const handleEdit = (usuario: Usuario) => {
        // Al editar, buscamos el ID del departamento que coincide con el nombre de la zona del usuario
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
        // Al resetear, volvemos a poner el departamento por defecto (el del usuario logueado)
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

    const filteredUsuarios = usuarios.filter(usuario => {
        const nombre = usuario.NOMBRE_USUARIO || "";
        const apellido = usuario.APELLIDO_USUARIO || "";
        const telefono = usuario.TELEFONO_USUARIO || "";
        const rol = usuario.ROL_USUARIO || "";
        const matchesSearch = (
            nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
            telefono.includes(searchTerm) ||
            rol.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesZona = !mostrarSoloMiZona || 
                          !usuarioLogueado.zonaAsignada || 
                          usuario.ZONA_ASIGNADA === usuarioLogueado.zonaAsignada;
        
        // Nueva condición: excluir a los usuarios con rol '2'
        const isNotRoleTwo = usuario.ROL_USUARIO !== '2';
        
        // Se añade la nueva condición al filtro final
        return matchesSearch && matchesZona && isNotRoleTwo;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
                    <div className="flex space-x-3">
                        <button onClick={handleRedirectToUsuarios} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                            <ArrowLeft className="w-5 h-5 mr-2" /> Regresar
                        </button>
                        <button onClick={handleRedirectToUsuarios} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                            <UserPlus className="w-5 h-5 mr-2" /> Registrar Votante
                        </button>
                    </div>
                </div>

                {/* Información del usuario logueado */}
                {usuarioLogueado.nombre && (
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6 hidden">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="mr-4">
                                    <p className="text-sm text-gray-500">Usuario actual</p>
                                    <p className="text-lg font-semibold text-gray-800">{usuarioLogueado.nombre}</p>
                                </div>
                                <div className="mr-4">
                                    <p className="text-sm text-gray-500">Zona asignada</p>
                                    <p className="text-lg font-semibold text-gray-800">{usuarioLogueado.nombreZona}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setMostrarSoloMiZona(!mostrarSoloMiZona)}
                                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                                    mostrarSoloMiZona 
                                    ? "bg-blue-600 text-white hover:bg-blue-700" 
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                }`}
                            >
                                <Filter className="w-4 h-4 mr-2" />
                                {mostrarSoloMiZona ? "Mostrando solo mi zona" : "Mostrando todas las zonas"}
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Formulario a la izquierda */}
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
                                <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Shield className="w-4 h-4 text-gray-400" /></div><select name="rol_usuario" value={form.rol_usuario} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"><option value="">Seleccionar rol</option><option value="LIDER">Lider</option></select><div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div></div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Check className="w-4 h-4 text-gray-400" /></div><select name="estado_usuario" value={form.estado_usuario} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"><option value="1">Activo</option><option value="0">Inactivo</option></select><div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-9"></path></svg></div></div>
                            </div>
                            
                            {/* Select de Departamento Filtrado */}
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
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></div>
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

                    {/* Tabla de usuarios a la derecha */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-800">Usuarios Registrados {mostrarSoloMiZona && usuarioLogueado.nombreZona && (<span className="text-sm font-normal text-gray-500 ml-2">({usuarioLogueado.nombreZona})</span>)}</h2>
                            <div className="relative"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="w-4 h-4 text-gray-400" /></div><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar usuarios..." className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" /></div>
                        </div>
                        {loadingUsuarios ? (<div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>) : (<div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b border-gray-200"><th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Nombre</th><th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Teléfono</th><th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Rol</th><th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Estado</th><th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Zona</th><th className="text-center py-2 px-2 text-sm font-medium text-gray-700">Acciones</th></tr></thead><tbody>{filteredUsuarios.length === 0 ? (<tr><td colSpan={6} className="text-center py-8 text-gray-500">{mostrarSoloMiZona ? "No se encontraron usuarios en tu zona" : "No se encontraron usuarios"}</td></tr>) : (filteredUsuarios.map(usuario => (<tr key={usuario.ID_USUARIO} className="border-b border-gray-100 hover:bg-gray-50"><td className="py-3 px-2"><div><div className="text-sm font-medium text-gray-900">{usuario.NOMBRE_USUARIO} {usuario.APELLIDO_USUARIO}</div></div></td><td className="py-3 px-2 text-sm text-gray-700">{usuario.TELEFONO_USUARIO}</td><td className="py-3 px-2 text-sm text-gray-700">{usuario.ROL_USUARIO}</td><td className="py-3 px-2"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${usuario.ESTADO_USUARIO === 1 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{usuario.ESTADO_USUARIO === 1 ? "Activo" : "Inactivo"}</span></td><td className="py-3 px-2 text-sm text-gray-700">{usuario.NOMBRE_ZONA}</td><td className="py-3 px-2"><div className="flex justify-center space-x-1"><button onClick={() => handleEdit(usuario)} className="p-1 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors" title="Editar"><Edit2 className="w-4 h-4 text-blue-600" /></button></div></td></tr>)))}</tbody></table></div>)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;