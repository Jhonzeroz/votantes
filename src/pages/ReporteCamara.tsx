import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Loader2,
  Filter,
  X,
  LayoutDashboard,
  FileDown,
  Users,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';

// Tipo para los datos de Votantes
export type Votante = {
  ID_VOTANTE: number;
  NUM_DOC: string;
  NOMBRE_COMPLETO: string;
  MESA: number | null;
  ZONA_NOMBRE: string;
  MUNICIPIO: string;
  USUARIO_NOMBRE: string;
  CREADO_EN: string;
  CAMARA: string;
  LUGAR_VOTACION: string; // Nuevo campo añadido
};

// Reutilizamos las funciones de manejo de token del componente original
const getToken = () => {
  return localStorage.getItem('token') || getCookie('token');
};

const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

const getCurrentUserInfo = () => {
  const token = getToken();
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const payload = JSON.parse(jsonPayload);
    return {
      id: payload.sub,
      role: payload.tipo_usuario,
      rol_usuario: payload.rol_usuario,
      zonaAsignada: payload.zona_asignada,
      nombreZona: payload.nombre_zona
    };
  } catch (error) {
    console.error('Error al decodificar el token JWT:', error);
    return null;
  }
};

const ReporteCamara: React.FC = () => {
  const navigate = useNavigate();
  const APIVOT = "https://devsoul.co/api_votantes";

  // Estados para la información del usuario y los datos del reporte
  const [currentUser, setCurrentUser] = useState<{ 
    id: number; 
    role: number; 
    rol_usuario?: number | null;
    zonaAsignada?: number | null;
    nombreZona?: string | null;
  } | null>(null);

  const [reportData, setReportData] = useState<Votante[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [errorReport, setErrorReport] = useState<string | null>(null);

  // Estados para filtros locales (búsqueda y exportación)
  const [q, setQ] = useState("");
  
  // Estados para los filtros
  const [fDepartamento, setFDepartamento] = useState("");
  const [fMunicipio, setFMunicipio] = useState("");
  const [fFechaInicio, setFFechaInicio] = useState("");
  const [fFechaFin, setFFechaFin] = useState("");

  const [exportandoExcel, setExportandoExcel] = useState(false);

  // Estados para paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const resultadosPorPagina = 10;

  // Efecto para obtener el usuario actual al cargar el componente
  useEffect(() => {
    const userInfo = getCurrentUserInfo();
    if (userInfo) {
      setCurrentUser({ 
        id: Number(userInfo.id), 
        role: Number(userInfo.role),
        rol_usuario: userInfo.rol_usuario ? Number(userInfo.rol_usuario) : null,
        zonaAsignada: userInfo.zonaAsignada,
        nombreZona: userInfo.nombreZona
      });
    } else {
        navigate("/Admin_gold");
    }
  }, [navigate]);

  // --- LÓGICA DE CARGA: Unida y corregida para todos los roles ---
  const fetchReportData = async () => {
    if (!currentUser) return;
    setLoadingReport(true);
    setErrorReport(null);

    try {
      let allData: Votante[] = [];
      
      // Rol 2 (Administrador): Carga TODOS los votantes con CAMARA='SI'
      if (currentUser.rol_usuario === 2) {
        console.log("Rol: 2 (Admin). Cargando todos los votantes para cámara.");
        const res = await fetch(`${APIVOT}/votantes_list_camara.php?limit=10000`);
        const data = await res.json();
        if (data?.success) {
          allData = data.data || [];
        } else {
          throw new Error(data?.error || "No se pudieron cargar los datos del reporte.");
        }
      } 
      // Rol 1 (Supervisor) u otros: Carga los de su zona Y los que él registró
      else {
        const promises = [];
        
        // Siempre cargamos los registros que el usuario mismo hizo
        console.log("Cargando votantes registrados por el usuario (ID:", currentUser.id, ")");
        promises.push(fetch(`${APIVOT}/votantes_list_camara.php?usuario=${currentUser.id}&limit=10000`).then(r => r.json()));

        // Si es supervisor, también cargamos todos los de su zona
        if (currentUser.rol_usuario === 1 && currentUser.nombreZona) {
          console.log("Rol: 1 (Supervisor). Cargando votantes de la zona asignada (NOMBRE:", currentUser.nombreZona, ")");
          promises.push(fetch(`${APIVOT}/votantes_list_camara.php?nombre_zona=${encodeURIComponent(currentUser.nombreZona)}&limit=10000`).then(r => r.json()));
        }

        const results = await Promise.all(promises);
        
        // Procesamos el primer resultado (registros del usuario)
        if (results[0]?.success) {
          allData = results[0].data || [];
        } else {
          throw new Error(results[0]?.error || "No se pudieron cargar los datos del usuario.");
        }

        // Si hay un segundo resultado (datos de la zona), lo fusionamos sin duplicados
        if (results[1]) {
          if (results[1]?.success) {
            const zonaData = results[1].data || [];
            const existingIds = new Set(allData.map(v => v.ID_VOTANTE));
            
            for (const votante of zonaData) {
              if (!existingIds.has(votante.ID_VOTANTE)) {
                allData.push(votante);
                existingIds.add(votante.ID_VOTANTE);
              }
            }
          } else {
            console.error("No se pudieron cargar los datos de la zona:", results[1]?.error);
            toast.warning("No se pudieron cargar los datos de su zona, mostrando solo sus registros.");
          }
        }
      }

      setReportData(allData);

    } catch (error: any) {
      console.error("Error al cargar datos del reporte:", error);
      setErrorReport(error.message);
      toast.error(error.message);
    } finally {
      setLoadingReport(false);
    }
  };

  // Cargar los datos cuando el usuario actual esté disponible
  useEffect(() => {
    if (currentUser) {
      fetchReportData();
    }
  }, [currentUser]);

  // --- LISTAS DINÁMICAS PARA LOS FILTROS ---
  const departamentosUnicos = useMemo(() => {
    const departamentos = new Set(reportData.map(v => v.ZONA_NOMBRE).filter(Boolean));
    return Array.from(departamentos).sort();
  }, [reportData]);

  const municipiosFiltrados = useMemo(() => {
    if (!fDepartamento) return [];
    const municipios = new Set(
      reportData
        .filter(v => v.ZONA_NOMBRE === fDepartamento)
        .map(v => v.MUNICIPIO)
        .filter(Boolean)
    );
    return Array.from(municipios).sort();
  }, [reportData, fDepartamento]);

  // Limpiar municipio si se cambia el departamento
  useEffect(() => {
    setFMunicipio("");
  }, [fDepartamento]);

  // --- LÓGICA DE FILTRADO DEL LADO DEL CLIENTE ---
  const datosFiltrados = useMemo(() => {
    let filtered = reportData;

    if (q) {
      const lowerCaseQuery = q.toLowerCase();
      filtered = filtered.filter(votante =>
        votante.NUM_DOC.includes(q) ||
        votante.NOMBRE_COMPLETO.toLowerCase().includes(lowerCaseQuery) ||
        votante.ZONA_NOMBRE.toLowerCase().includes(lowerCaseQuery) ||
        votante.MUNICIPIO.toLowerCase().includes(lowerCaseQuery) ||
        (votante.USUARIO_NOMBRE && votante.USUARIO_NOMBRE.toLowerCase().includes(lowerCaseQuery)) ||
        (votante.LUGAR_VOTACION && votante.LUGAR_VOTACION.toLowerCase().includes(lowerCaseQuery))
      );
    }

    if (fDepartamento) {
      filtered = filtered.filter(votante => votante.ZONA_NOMBRE === fDepartamento);
    }

    if (fMunicipio) {
      filtered = filtered.filter(votante => votante.MUNICIPIO === fMunicipio);
    }
    
    if (fFechaInicio) {
      filtered = filtered.filter(votante => new Date(votante.CREADO_EN) >= new Date(fFechaInicio));
    }

    if (fFechaFin) {
      const fechaFinConUnDiaMas = new Date(fFechaFin);
      fechaFinConUnDiaMas.setDate(fechaFinConUnDiaMas.getDate() + 1);
      filtered = filtered.filter(votante => new Date(votante.CREADO_EN) < fechaFinConUnDiaMas);
    }

    return filtered;
  }, [reportData, q, fDepartamento, fMunicipio, fFechaInicio, fFechaFin]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [q, fDepartamento, fMunicipio, fFechaInicio, fFechaFin]);

  // Calcular resultados paginados
  const resultadosPaginados = useMemo(() => {
    const indiceUltimoResultado = paginaActual * resultadosPorPagina;
    const indicePrimerResultado = indiceUltimoResultado - resultadosPorPagina;
    return datosFiltrados.slice(indicePrimerResultado, indiceUltimoResultado);
  }, [datosFiltrados, paginaActual]);

  const totalPaginas = useMemo(() => {
    return Math.ceil(datosFiltrados.length / resultadosPorPagina);
  }, [datosFiltrados]);

  // --- FUNCIÓN PARA EXPORTAR A EXCEL (MODIFICADA) ---
  const descargarExcel = async () => {
    setExportandoExcel(true);
    try {
      const datos = datosFiltrados;

      if (datos.length === 0) {
        toast.warning("No hay datos para exportar");
        setExportandoExcel(false);
        return;
      }

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(datos.map(votante => ({
        'ID': votante.ID_VOTANTE,
        'Documento': votante.NUM_DOC,
        'Nombre Completo': votante.NOMBRE_COMPLETO,
        'Departamento': votante.ZONA_NOMBRE,
        'Municipio': votante.MUNICIPIO,
        'Mesa': votante.MESA || 'N/A',
        'Lugar de Votación': votante.LUGAR_VOTACION || 'N/A', // Nuevo campo añadido
        'Usuario Asignado': votante.USUARIO_NOMBRE || 'SIN ASIGNAR',
        'Fecha de Registro': votante.CREADO_EN,
        'Registrado para Cámara': votante.CAMARA,
      })));

      XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte de Cámara");
      const nombreArchivo = `reporte_camara_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, nombreArchivo);

      toast.success("Archivo Excel descargado correctamente");
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      toast.error("Error al exportar a Excel");
    } finally {
      setExportandoExcel(false);
    }
  };

  const limpiarFiltros = () => {
    setQ("");
    setFDepartamento("");
    setFMunicipio("");
    setFFechaInicio("");
    setFFechaFin("");
  };

  return (
    <div className="min-h-screen bg-[#F7F8FB] text-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Reporte de Votantes para Cámara</h1>
              <p className="text-sm text-slate-500 mt-1">
                Visualiza los votantes que registraron para Cámara según tu rol.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/dashboard")}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Nuevo Votante
              </button>
              <button
                onClick={descargarExcel}
                disabled={exportandoExcel || datosFiltrados.length === 0}
                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 disabled:bg-slate-300 text-white transition shadow flex items-center gap-2"
              >
                {exportandoExcel ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    Exportar a Excel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold">Buscar y Filtrar</h4>
            </div>
            <button
              onClick={limpiarFiltros}
              className="text-sm text-slate-500 hover:text-slate-700 underline"
            >
              Limpiar Filtros
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Por documento, nombre..."
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

            <div className="relative">
              <select
                value={fDepartamento}
                onChange={(e) => setFDepartamento(e.target.value)}
                className="w-full appearance-none p-2.5 rounded-xl bg-white border border-slate-300 shadow-inner text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none pr-9"
              >
                <option value="">Departamento: Todos</option>
                {departamentosUnicos.map((dep) => (
                  <option key={dep} value={dep}>
                    {dep}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-3 pointer-events-none text-slate-400">▼</span>
            </div>

            <div className="relative">
              <select
                value={fMunicipio}
                onChange={(e) => setFMunicipio(e.target.value)}
                disabled={!fDepartamento}
                className="w-full appearance-none p-2.5 rounded-xl bg-white border border-slate-300 shadow-inner text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none pr-9 disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                <option value="">Municipio: Todos</option>
                {municipiosFiltrados.map((mun) => (
                  <option key={mun} value={mun}>
                    {mun}
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-3 pointer-events-none text-slate-400">▼</span>
            </div>

            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="date"
                value={fFechaInicio}
                onChange={(e) => setFFechaInicio(e.target.value)}
                className="w-full pl-9 p-2.5 rounded-xl bg-white border border-slate-300 placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="date"
                value={fFechaFin}
                onChange={(e) => setFFechaFin(e.target.value)}
                className="w-full pl-9 p-2.5 rounded-xl bg-white border border-slate-300 placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Tabla de Datos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          {loadingReport ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p>Cargando datos del reporte...</p>
            </div>
          ) : errorReport ? (
            <div className="flex flex-col items-center justify-center py-12 text-red-500">
              <p className="font-semibold">Error al cargar los datos</p>
              <p className="text-sm">{errorReport}</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Resultados
                </h3>
                <p className="text-sm text-slate-500">
                  Mostrando {datosFiltrados.length} de {reportData.length} votantes
                </p>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Documento</th>
                      <th className="text-left px-4 py-3 font-medium">Nombre Completo</th>
                      <th className="text-left px-4 py-3 font-medium">Departamento</th>
                      <th className="text-left px-4 py-3 font-medium">Municipio</th>
                      <th className="text-left px-4 py-3 font-medium">Mesa</th>
                      <th className="text-left px-4 py-3 font-medium">Lugar de Votación</th>
                      <th className="text-left px-4 py-3 font-medium">Usuario Asignado</th>
                      <th className="text-left px-4 py-3 font-medium">Fecha de Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultadosPaginados.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                          No se encontraron votantes que coincidan con los criterios.
                        </td>
                      </tr>
                    ) : (
                      resultadosPaginados.map((votante) => (
                        <tr key={votante.ID_VOTANTE} className="border-t border-slate-200 hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-mono text-xs text-slate-700">{votante.NUM_DOC}</td>
                          <td className="px-4 py-3">{votante.NOMBRE_COMPLETO}</td>
                          <td className="px-4 py-3">{votante.ZONA_NOMBRE}</td>
                          <td className="px-4 py-3">{votante.MUNICIPIO || 'No especificado'}</td>
                          <td className="px-4 py-3">{votante.MESA || 'N/A'}</td>
                          <td className="px-4 py-3">{votante.LUGAR_VOTACION || 'N/A'}</td>
                          <td className="px-4 py-3">{votante.USUARIO_NOMBRE || 'SIN ASIGNAR'}</td>
                          <td className="px-4 py-3 text-xs text-slate-500">{votante.CREADO_EN}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPaginas > 1 && (
                <div className="flex justify-between items-center mt-4 px-1">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default ReporteCamara;