import React, { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import {
  UserPlus,
  Search,
  Loader2,
  Phone,
  MapPin,
  User,
  IdCard,
  Users,
  Filter,
  X,
  LayoutDashboard,
  ChevronDown,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';

/**
 * Props de este módulo.
 * Si no pasas zonas/usuarios, hará fetch a endpoints por defecto.
 */
export type Opcion = { id: number; nombre: string };

// Definimos el tipo para los datos de un votante
export type Votante = {
  NUM_DOC: string;
  NOMBRE_COMPLETO: string;
  MESA: string;
  PUESTO: string;
  LUGAR_VOTACION: string;
  ZONA_NOMBRE: string;
  USUARIO_NOMBRE: string;
  CREADO_EN: string;
};

interface VotantesViewProps {
  zonas?: Opcion[];
  usuarios?: Opcion[];
  APIVOT?: string; // p.e. "/api/votos"
}

const defaultAPIVOT = "https://devsoul.co/api_votantes";

interface MunicipioData {
  ID_MUNICIPIO: string | number;
  NOMBRE_MUNICIPIO: string;
}

const initialForm = {
  tipo_doc: "CC",
  num_doc: "",
  nombre1: "",
  nombre2: "",
  apellido1: "",
  apellido2: "",
  telefono: "",
  direccion: "",
  id_zona_asignada: "",
  id_usuario_asignado: "",
  // NUEVOS CAMPOS
  puesto: "",
  lugar_votacion: "",
};

const tiposDoc = [
  { value: "CC", label: "Cédula" },
  { value: "CE", label: "Cédula Extranjería" },
  { value: "PAS", label: "Pasaporte" },
];


// Función para obtener el token JWT
const getToken = () => {
  return localStorage.getItem('token') || getCookie('token');
};

// Función auxiliar para obtener cookies
const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

// Función para decodificar el token JWT y obtener el ID del usuario
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
    return payload.sub;
  } catch (error) {
    console.error('Error al decodificar el token JWT:', error);
    return null;
  }
};

// Función para obtener el tipo de usuario
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
    return payload.tipo_usuario;
  } catch (error) {
    console.error('Error al decodificar el token JWT:', error);
    return null;
  }
};

const VotantesView: React.FC<VotantesViewProps> = ({
  zonas,
  usuarios,
  APIVOT = defaultAPIVOT,
}) => {
  const navigate = useNavigate();
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Estados base
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [zonasState, setZonasState] = useState<Opcion[]>(zonas || []);
  const [usuariosState, setUsuariosState] = useState<Opcion[]>(usuarios || []);
  const [currentUser, setCurrentUser] = useState<{ id: number; role: number } | null>(null);

  // ESTADO MAESTRO: Contiene TODOS los votantes cargados desde la API
  const [allVotantes, setAllVotantes] = useState<Votante[]>([]);
  const [loadingVotantes, setLoadingVotantes] = useState(false);

  // Tabla últimos ingresos (se mantiene igual)
  const [ultimos, setUltimos] = useState<Votante[]>([]);
  const [loadingUltimos, setLoadingUltimos] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Filtros / búsqueda
  const [q, setQ] = useState("");
  const [fZona, setFZona] = useState("");
  const [fUsuario, setFUsuario] = useState("");
  const [fMesa, setFMesa] = useState("");
  const [exportandoExcel, setExportandoExcel] = useState(false);

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const resultadosPorPagina = 10;

  // --- LÓGICA DE FILTRADO DEL LADO DEL CLIENTE ---

  // 1. Usuarios únicos del conjunto MAESTRO de datos para el filtro dinámico
  const usuariosUnicosEnDatos = useMemo(() => {
    const usuariosMap = new Map<string, number>();
    allVotantes.forEach(votante => {
      if (votante.USUARIO_NOMBRE && votante.USUARIO_NOMBRE !== 'SIN ASIGNAR') {
        const usuarioEncontrado = usuariosState.find(u => u.nombre === votante.USUARIO_NOMBRE);
        if (usuarioEncontrado) {
          usuariosMap.set(votante.USUARIO_NOMBRE, usuarioEncontrado.id);
        }
      }
    });
    return Array.from(usuariosMap.entries()).map(([nombre, id]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [allVotantes, usuariosState]);

  // 2. Filtrado de datos basado en los filtros seleccionados
  const datosFiltrados = useMemo(() => {
    let filtered = allVotantes;

    if (q) {
      const lowerCaseQuery = q.toLowerCase();
      filtered = filtered.filter(votante =>
        votante.NUM_DOC.includes(q) ||
        votante.NOMBRE_COMPLETO.toLowerCase().includes(lowerCaseQuery)
      );
    }

    if (fZona) {
      const zonaSeleccionada = zonasState.find(z => String(z.id) === fZona);
      if (zonaSeleccionada) {
        filtered = filtered.filter(votante => votante.ZONA_NOMBRE === zonaSeleccionada.nombre);
      }
    }
    
    // El filtro de usuario solo aplica para administradores
    if (currentUser && currentUser.role === 1 && fUsuario) {
      const usuarioSeleccionado = usuariosState.find(u => String(u.id) === fUsuario);
      if (usuarioSeleccionado) {
        filtered = filtered.filter(votante => votante.USUARIO_NOMBRE === usuarioSeleccionado.nombre);
      }
    }

    if (fMesa) {
      filtered = filtered.filter(votante => votante.MESA === fMesa);
    }

    return filtered;
  }, [allVotantes, q, fZona, fUsuario, fMesa, currentUser, zonasState, usuariosState]);

  // 3. Calcular resultados paginados a partir de los datos filtrados
  const resultadosPaginados = useMemo(() => {
    const indiceUltimoResultado = paginaActual * resultadosPorPagina;
    const indicePrimerResultado = indiceUltimoResultado - resultadosPorPagina;
    return datosFiltrados.slice(indicePrimerResultado, indiceUltimoResultado);
  }, [datosFiltrados, paginaActual]);

  // 4. Total de páginas basado en los datos filtrados
  const totalPaginas = useMemo(() => {
    return Math.ceil(datosFiltrados.length / resultadosPorPagina);
  }, [datosFiltrados]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [q, fZona, fUsuario, fMesa]);

  // --- FIN LÓGICA DE FILTRADO ---

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token');
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    toast.success("Sesión cerrada correctamente");
    navigate("/Admin_gold");
  };

  // Efecto para obtener el usuario actual al cargar el componente
  useEffect(() => {
    const userId = getCurrentUserId();
    const userRole = getCurrentUserRole();
    if (userId && userRole !== null) {
      setCurrentUser({ id: Number(userId), role: Number(userRole) });
    }
  }, []);

  useEffect(() => {
    if (err) {
      console.log("❌ Error detectado:", err);
    }
  }, [err]);

  // Cargar combos si no vinieron por props
  useEffect(() => {
    const loadCombos = async () => {
      try {
        if (!zonas) {
          const rz = await fetch(`${APIVOT}/mncpio_list.php`).then((r) => r.json());
          if (rz?.success && Array.isArray(rz.data)) {
            const zonasFormateadas = Array.isArray(rz.data) ? rz.data.map((item: MunicipioData) => ({
              id: Number(item.ID_MUNICIPIO || 0),
              nombre: String(item.NOMBRE_MUNICIPIO || '')
            })) : [];
            setZonasState(zonasFormateadas);
          }
        }
        if (!usuarios) {
          const ru = await fetch(`${APIVOT}/usuarios_list.php`).then((r) => r.json());
          if (ru?.success && Array.isArray(ru.data)) setUsuariosState(ru.data);
        }
      } catch {
        // opcional
      }
    };
    loadCombos();
  }, [APIVOT, zonas, usuarios]);

  // NUEVA FUNCIÓN: Cargar todos los votantes (datos maestros)
  const fetchAllVotantesData = async () => {
    setLoadingVotantes(true);
    try {
      // Si no es admin, solo carga sus votantes asignados
      const url = currentUser && currentUser.role !== 1 
        ? `${APIVOT}/votantes_list.php?usuario=${currentUser.id}`
        : `${APIVOT}/votantes_list.php`;
        
      const res = await fetch(url).then((r) => r.json());
      if (res?.success) {
        setAllVotantes(res.data || []);
      } else {
        toast.error(res?.error || "No se pudieron cargar los votantes");
        setAllVotantes([]);
      }
    } catch (error) {
      console.error("Error al cargar todos los votantes:", error);
      toast.error("Error de conexión al cargar votantes");
      setAllVotantes([]);
    } finally {
      setLoadingVotantes(false);
    }
  };

  // Cargar últimos ingresos (10) - se mantiene igual
  const fetchUltimos = async () => {
    setLoadingUltimos(true);
    try {
      const url = currentUser && currentUser.role !== 1 
        ? `${APIVOT}/votantes_list.php?limit=10&usuario=${currentUser.id}`
        : `${APIVOT}/votantes_list.php?limit=10`;
        
      const res = await fetch(url).then((r) => r.json());
      if (res?.success) setUltimos(res.data || []);
      else setErr(res?.error || "No se pudieron obtener los últimos ingresos");
    } catch {
      setErr("No se pudieron obtener los últimos ingresos");
      toast.error("No se pudieron obtener los últimos ingresos");
    } finally {
      setLoadingUltimos(false);
    }
  };

  // Cargar datos maestros y últimos ingresos al montar o cuando cambia el usuario
  useEffect(() => {
    if (currentUser) {
      fetchAllVotantesData();
      fetchUltimos();
    }
  }, [currentUser]);
  
  // Form helpers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => setForm(initialForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id_zona_asignada || !form.id_usuario_asignado) {
      return toast.warning("Selecciona un municipio y usuario asignado");
    }
    if (!form.num_doc || !form.nombre1 || !form.apellido1) {
      return toast.warning(
        "Documento, primer nombre y primer apellido son obligatorios"
      );
    }

    setSaving(true);
    try {
      const res = await fetch(`${APIVOT}/votante_create.php`, {
        method: "POST",
        body: new URLSearchParams(form as any),
      }).then((r) => r.json());

      if (res?.success) {
        toast.success("Votante guardado ✅");
        resetForm();
        fetchUltimos();
        // Actualizar la lista maestra para que incluya el nuevo votante
        await fetchAllVotantesData();
      } else {
        toast.error(res?.message || res?.error || "No se pudo guardar");
      }
    } catch {
      toast.error("Error de red");
    } finally {
      setSaving(false);
    }
  };

  // Función para exportar a Excel ahora usa los datos filtrados
  const descargarExcel = async () => {
    setExportandoExcel(true);
    try {
      const datos = datosFiltrados; // Usar los datos ya filtrados en el cliente

      if (datos.length === 0) {
        toast.warning("No hay datos para exportar");
        setExportandoExcel(false);
        return;
      }

      const datosExcel = datos.map((votante: Votante) => ({
        'Documento': votante.NUM_DOC,
        'Nombre Completo': votante.NOMBRE_COMPLETO,
        'Mesa': votante.MESA,
        'Municipio': votante.ZONA_NOMBRE,
        'Usuario Asignado': votante.USUARIO_NOMBRE,
        'Fecha de Registro': votante.CREADO_EN
      }));

      const workbook = XLSX.utils.book_new();
      const worksheetOriginal = XLSX.utils.json_to_sheet(datosExcel);
      XLSX.utils.book_append_sheet(workbook, worksheetOriginal, "Votantes");

      const mainTitleStyle = {
        font: { sz: 16, bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "366092" } },
        alignment: { horizontal: "center", vertical: "center" }
      };

      const summaryHeaderStyle = {
        font: { sz: 12, bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "70AD47" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
      
      const userTitleStyle = {
        font: { sz: 13, bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "5B9BD5" } },
        alignment: { horizontal: "left", vertical: "center" }
      };

      const detailHeaderStyle = {
        font: { sz: 11, bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "A5A5A5" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true }
      };

      type VotantesPorUsuario = Record<string, Votante[]>;
      const datosAgrupadosPorUsuario: VotantesPorUsuario = {};
      for (const votante of datos) {
        const usuario = votante.USUARIO_NOMBRE || 'SIN ASIGNAR';
        if (!datosAgrupadosPorUsuario[usuario]) {
          datosAgrupadosPorUsuario[usuario] = [];
        }
        datosAgrupadosPorUsuario[usuario].push(votante);
      }
      

      const worksheetResumen: XLSX.WorkSheet = {};
      let currentRow = 0;

      XLSX.utils.sheet_add_aoa(worksheetResumen, [['RESUMEN DE VOTANTES POR USUARIO']], { origin: `A${currentRow + 1}` });
      worksheetResumen['A1'].s = mainTitleStyle;
      currentRow++;

      currentRow++;
      const summaryHeaders = ['USUARIO ASIGNADO', 'CANTIDAD DE VOTANTES'];
      XLSX.utils.sheet_add_aoa(worksheetResumen, [summaryHeaders], { origin: `A${currentRow + 1}` });
      
      worksheetResumen['A' + (currentRow + 1)].s = summaryHeaderStyle;
      worksheetResumen['B' + (currentRow + 1)].s = summaryHeaderStyle;
      currentRow++;

      for (const usuario in datosAgrupadosPorUsuario) {
        XLSX.utils.sheet_add_aoa(worksheetResumen, [[usuario, datosAgrupadosPorUsuario[usuario].length]], { origin: `A${currentRow + 1}` });
        currentRow++;
      }

      for (const usuario in datosAgrupadosPorUsuario) {
        const votantesDelUsuario = datosAgrupadosPorUsuario[usuario];
        
        currentRow++;
        const userTitleText = `VOTANTES ASIGNADOS A: ${usuario.toUpperCase()} (TOTAL: ${votantesDelUsuario.length})`;
        XLSX.utils.sheet_add_aoa(worksheetResumen, [[userTitleText]], { origin: `A${currentRow + 1}` });
        worksheetResumen['A' + (currentRow + 1)].s = userTitleStyle;
        currentRow++;

        const detailHeaders = ['DOCUMENTO', 'NOMBRE COMPLETO', 'MESA', 'MUNICIPIO', 'FECHA DE REGISTRO'];
        XLSX.utils.sheet_add_aoa(worksheetResumen, [detailHeaders], { origin: `A${currentRow + 1}` });
        
        detailHeaders.forEach((_, colIndex) => {
          const cellAddress = XLSX.utils.encode_cell({ r: currentRow, c: colIndex });
          if (!worksheetResumen[cellAddress]) return;
          worksheetResumen[cellAddress].s = detailHeaderStyle;
        });
        currentRow++;

        const voterData = votantesDelUsuario.map(v => [
          v.NUM_DOC, v.NOMBRE_COMPLETO, v.MESA, v.PUESTO, v.LUGAR_VOTACION, v.ZONA_NOMBRE, v.CREADO_EN
        ]);
        XLSX.utils.sheet_add_aoa(worksheetResumen, voterData, { origin: `A${currentRow + 1}` });
        currentRow += votantesDelUsuario.length;
      }

      worksheetResumen['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      ];
      
      let mergeStartRow = 4;
      for (const usuario in datosAgrupadosPorUsuario) {
        worksheetResumen['!merges'].push({
          s: { r: mergeStartRow, c: 0 },
          e: { r: mergeStartRow, c: 6 }
        });
        mergeStartRow += 2 + 1 + datosAgrupadosPorUsuario[usuario].length;
      }

      worksheetResumen['!cols'] = [
        { wch: 15 },
        { wch: 35 },
        { wch: 8 },
        { wch: 25 },
        { wch: 30 },
        { wch: 20 },
        { wch: 20 },
      ];

      XLSX.utils.book_append_sheet(workbook, worksheetResumen, "Resumen por Usuario");

      const nombreArchivo = `reporte_votantes_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, nombreArchivo);

      toast.success("Archivo Excel descargado correctamente");
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      toast.error("Error al exportar a Excel");
    } finally {
      setExportandoExcel(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAdminMenuOpen(false);
      }
    };

    if (adminMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [adminMenuOpen]);

  // Crear una lista de usuarios filtrada que solo contenga al usuario logueado.
  const usuariosFiltrados = useMemo(() => {
    if (!currentUser) return [];
    return usuariosState.filter(u => u.id === currentUser.id);
  }, [usuariosState, currentUser]);

  // Efecto para autoseleccionar al usuario logueado en el formulario.
  useEffect(() => {
    if (currentUser && usuariosFiltrados.length > 0) {
      setForm(prevForm => ({
        ...prevForm,
        id_usuario_asignado: String(currentUser.id)
      }));
    }
  }, [currentUser, usuariosFiltrados]);

  return (
    <div className="min-h-screen bg-[#F7F8FB] text-slate-900 p-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section
          className="xl:col-span-2 rounded-3xl border border-slate-200
                     bg-gradient-to-br from-[#fdfdfd] to-[#f7f8fb]
                     shadow-[rgba(255,255,255,0.85)_-6px_-6px_12px,rgba(0,0,0,0.08)_8px_8px_16px]
                     transition hover:shadow-[rgba(255,255,255,0.9)_-6px_-6px_14px,rgba(0,0,0,0.12)_10px_10px_20px]"
        >
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 shadow-inner">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                Registrar nuevo votante
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={descargarExcel}
                disabled={exportandoExcel}
                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white transition shadow flex items-center gap-2"
              >
                {exportandoExcel ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>Excel</>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate("/DashboardVotantesResumen")}
                aria-label="Ir al dashboard"
                className="group relative inline-flex items-center gap-2 rounded-2xl px-5 py-2.5
               bg-gradient-to-r from-blue-600 to-indigo-600 text-white
               shadow-[0_10px_20px_-10px_rgba(37,99,235,0.6)]
               hover:shadow-[0_16px_28px_-12px_rgba(37,99,235,0.7)]
               transition-transform duration-200 ease-out hover:-translate-y-0.5 focus:outline-none
               focus:ring-2 focus:ring-blue-300"
              >
                <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                  <span
                    className="absolute -left-10 top-0 h-full w-16 translate-x-0 -skew-x-12
                       bg-white/25 opacity-0 transition-all duration-500
                       group-hover:translate-x-[140%] group-hover:opacity-100"
                  />
                </span>

                <LayoutDashboard className="w-4 h-4 opacity-90" />
                <span className="font-medium tracking-wide">Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/Organizacion")}
                aria-label="Ir al dashboard"
                className="group relative inline-flex items-center gap-2 rounded-2xl px-5 py-2.5
               bg-gradient-to-r from-blue-600 to-indigo-600 text-white
               shadow-[0_10px_20px_-10px_rgba(37,99,235,0.6)]
               hover:shadow-[0_16px_28px_-12px_rgba(37,99,235,0.7)]
               transition-transform duration-200 ease-out hover:-translate-y-0.5 focus:outline-none
               focus:ring-2 focus:ring-blue-300"
              >
                <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                  <span
                    className="absolute -left-10 top-0 h-full w-16 translate-x-0 -skew-x-12
                       bg-white/25 opacity-0 transition-all duration-500
                       group-hover:translate-x-[140%] group-hover:opacity-100"
                  />
                </span>

                <LayoutDashboard className="w-4 h-4 opacity-90" />
                <span className="font-medium tracking-wide">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/Mapa")}
                aria-label="Ir al dashboard"
                className="group relative inline-flex items-center gap-2 rounded-2xl px-5 py-2.5
               bg-gradient-to-r from-blue-600 to-indigo-600 text-white
               shadow-[0_10px_20px_-10px_rgba(37,99,235,0.6)]
               hover:shadow-[0_16px_28px_-12px_rgba(37,99,235,0.7)]
               transition-transform duration-200 ease-out hover:-translate-y-0.5 focus:outline-none
               focus:ring-2 focus:ring-blue-300"
              >
                <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                  <span
                    className="absolute -left-10 top-0 h-full w-16 translate-x-0 -skew-x-12
                       bg-white/25 opacity-0 transition-all duration-500
                       group-hover:translate-x-[140%] group-hover:opacity-100"
                  />
                </span>

                <MapPin className="w-4 h-4 opacity-90" />
                <span className="font-medium tracking-wide"> Mapa </span>
              </button>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setAdminMenuOpen(!adminMenuOpen)}
                  aria-label="Menú de administración"
                  className="group relative inline-flex items-center gap-2 rounded-2xl px-5 py-2.5
                 bg-gradient-to-r from-orange-600 to-orange-600 text-white
                 shadow-[0_10px_20px_-10px_rgba(251,146,60,0.6)]
                 hover:shadow-[0_16px_28px_-12px_rgba(251,146,60,0.7)]
                 transition-transform duration-200 ease-out hover:-translate-y-0.5 focus:outline-none
                 focus:ring-2 focus:ring-orange-300"
                >
                  <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                    <span
                      className="absolute -left-10 top-0 h-full w-16 translate-x-0 -skew-x-12
                         bg-white/25 opacity-0 transition-all duration-500
                         group-hover:translate-x-[140%] group-hover:opacity-100"
                    />
                  </span>

                  <Settings className="w-4 h-4 opacity-90" />
                  <span className="font-medium tracking-wide">Administración</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${adminMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {adminMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 overflow-hidden">
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          navigate("/Usuarios");
                          setAdminMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Usuarios
                      </button>

                       <button
                        type="button"
                        onClick={() => {
                          navigate("/VotanteManagement");
                          setAdminMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Promover Usuario
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          console.log("Navegando a /Minicipios");
                          navigate("/Minicipios");
                          setAdminMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                      >
                        <MapPin className="w-4 h-4" />
                        Municipios
                      </button>

                      <div className="border-t border-gray-200 my-1"></div>

                      <button
                        type="button"
                        onClick={() => {
                          handleLogout();
                          setAdminMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de documento
              </label>
              <div className="relative">
                <select
                  name="tipo_doc"
                  value={form.tipo_doc}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl bg-white border border-slate-200 shadow-inner
                             focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  {tiposDoc.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <IdCard className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Número de documento
              </label>
              <input
                name="num_doc"
                value={form.num_doc}
                onChange={handleChange}
                required
                placeholder="Ej: 1012345678"
                className="w-full p-3 rounded-xl bg-white border border-slate-200 shadow-inner placeholder-slate-400
                           focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            
            {/* Nombres */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Primer nombre
              </label>
              <div className="relative">
                <input
                  name="nombre1"
                  value={form.nombre1}
                  onChange={handleChange}
                  required
                  className="w-full p-3 rounded-xl bg-white border border-slate-200 shadow-inner
                             focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <User className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Segundo nombre
              </label>
              <input
                name="nombre2"
                value={form.nombre2}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-white border border-slate-200 shadow-inner
                           focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            {/* Apellidos */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Primer apellido
              </label>
              <input
                name="apellido1"
                value={form.apellido1}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-xl bg-white border border-slate-200 shadow-inner
                           focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Segundo apellido
              </label>
              <input
                name="apellido2"
                value={form.apellido2}
                onChange={handleChange}
                className="w-full p-3 rounded-xl bg-white border border-slate-200 shadow-inner
                           focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            {/* Contacto */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Teléfono
              </label>
              <div className="relative">
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="Ej: 3001234567"
                  className="w-full p-3 rounded-xl bg-white border border-slate-200 shadow-inner placeholder-slate-400
                             focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <Phone className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Dirección
              </label>
              <div className="relative">
                <input
                  name="direccion"
                  value={form.direccion}
                  onChange={handleChange}
                  placeholder="Calle 10 # 20-30"
                  className="w-full p-3 rounded-xl bg-white border border-slate-200 shadow-inner placeholder-slate-400
                             focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <MapPin className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
              </div>
            </div>

            {/* Relaciones */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Municipio
              </label>
              <select
                name="id_zona_asignada"
                value={form.id_zona_asignada}
                onChange={handleChange}
                required
                className="w-full p-3 rounded-xl bg-white border border-slate-200 shadow-inner
                           focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
              >
                <option value="">-- Seleccione un Municipio --</option>
                {zonasState.map((z) => (
                  <option key={z.id} value={String(z.id)}>
                    {z.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Usuario asignado
              </label>
              <select
                name="id_usuario_asignado"
                value={form.id_usuario_asignado}
                onChange={handleChange}
                required
                disabled
                className="w-full p-3 rounded-xl bg-white border border-slate-200 shadow-inner
                           focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">-- Seleccione usuario --</option>
                {usuariosFiltrados.map((u) => (
                  <option key={u.id} value={String(u.id)}>
                    {u.nombre.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4">
              {form !== initialForm && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2 rounded-xl border border-slate-300 bg-gradient-to-br from-white to-slate-50 
                             text-slate-700 shadow hover:shadow-md transition"
                >
                  Limpiar
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 
                           hover:from-blue-500 hover:to-indigo-500 transition text-white font-medium 
                           shadow-[0_6px_16px_-6px_rgba(37,99,235,0.45)] flex items-center gap-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {saving ? "Guardando..." : "Guardar votante"}
              </button>
            </div>
          </form>
        </section>

        {/* Columna derecha: Filtros + Últimos ingresos */}
        <aside className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold">Buscar / Filtrar</h4>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Documento, nombre o apellido"
                  className="w-full pl-9 pr-9 p-2.5 rounded-xl bg-white border border-slate-300 placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                {q && (
                  <button
                    className="absolute right-2 top-1.5 p-1.5 hover:bg-slate-100 rounded transition"
                    onClick={() => setQ("")}
                    type="button"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
           

        

                {currentUser && currentUser.role === 1 && (
                  <div className="relative">
                    <select
                      value={fUsuario}
                      onChange={(e) => setFUsuario(e.target.value)}
                      className="w-full appearance-none p-3 rounded-xl bg-gradient-to-br from-white to-slate-50 
                                border border-slate-300 shadow-inner text-slate-700
                                focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none pr-9"
                    >
                      <option value="">Usuario: Todos</option>
                      {usuariosUnicosEnDatos.map((u) => (
                        <option key={u.id} value={String(u.id)}>
                          {u.nombre}
                        </option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-3 pointer-events-none text-slate-400">▼</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    setQ("");
                    setFZona("");
                    setFUsuario("");
                    setFMesa("");
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 bg-gradient-to-br from-white to-slate-50 
                             text-slate-700 shadow hover:shadow-md transition flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Limpiar filtros
                </button>
              </div>

                 <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-emerald-600" />
              <h4 className="font-semibold">Últimos ingresos</h4>
            </div>


              <div className="mt-2">
                {loadingVotantes ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Cargando datos...
                  </div>
                ) : datosFiltrados.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-slate-500">
                        {datosFiltrados.length} de {allVotantes.length} votantes
                      </p>
                    </div>
                    <div className="max-h-80 overflow-auto rounded-xl border border-slate-200">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-slate-50 text-slate-600">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium">Documento</th>
                            <th className="text-left px-3 py-2 font-medium">Nombre</th>
                            <th className="text-left px-3 py-2 font-medium">Usuario</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultadosPaginados.map((r, i) => (
                            <tr key={i} className="border-t border-slate-200 hover:bg-slate-50/70">
                              <td className="px-3 py-2 font-mono text-xs text-slate-700">{r.NUM_DOC}</td>
                              <td className="px-3 py-2">{r.NOMBRE_COMPLETO}</td>
                              <td className="px-3 py-2">{r.USUARIO_NOMBRE}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Paginación */}
                    {totalPaginas > 1 && (
                      <div className="flex justify-between items-center mt-3 px-1">
                        <button
                          onClick={() => setPaginaActual(paginaActual > 1 ? paginaActual - 1 : 1)}
                          disabled={paginaActual === 1}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Anterior
                        </button>
                        <span className="text-sm text-slate-600">
                          Página {paginaActual} de {totalPaginas}
                        </span>
                        <button
                          onClick={() => setPaginaActual(paginaActual < totalPaginas ? paginaActual + 1 : paginaActual)}
                          disabled={paginaActual === totalPaginas}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
                        >
                          Siguiente
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  !loadingVotantes && <p className="text-xs text-slate-500">No se encontraron votantes.</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hidden">
         

            {loadingUltimos ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
              </div>
            ) : (
              <div className="max-h-96 overflow-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">Documento</th>
                      <th className="text-left px-3 py-2 font-medium">Nombre</th>
                      <th className="text-left px-3 py-2 font-medium">Usuario</th>
                      <th className="text-left px-3 py-2 font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimos.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-6 text-center text-slate-500"
                        >
                          Sin registros recientes
                        </td>
                      </tr>
                    ) : (
                      ultimos.map((r, i) => (
                        <tr key={i} className="border-t border-slate-200 hover:bg-slate-50/70">
                          <td className="px-3 py-2 font-mono text-xs text-slate-700">
                            {r.NUM_DOC}
                          </td>
                          <td className="px-3 py-2">{r.NOMBRE_COMPLETO}</td>
                          <td className="px-3 py-2">{r.USUARIO_NOMBRE}</td>
                          <td className="px-3 py-2 text-xs text-slate-500">
                            {r.CREADO_EN}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-3 text-right">
              <button
                onClick={fetchUltimos}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition"
              >
                Refrescar
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default VotantesView;