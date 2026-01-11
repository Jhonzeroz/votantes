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

// Reutilizamos el tipo Votante del componente original
export type Votante = {
  ID_VOTANTE: number;
  NUM_DOC: string;
  NOMBRE_COMPLETO: string;
  MESA: number | null;
  ZONA_NOMBRE: string;
  MUNICIPIO: string;
  USUARIO_NOMBRE: string;
  CREADO_EN: string;
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
      role: payload.tipo_usuario, // Perfil principal (1 = Admin)
      rol_usuario: payload.rol_usuario, // Rol específico (1, 2, 0, etc.)
      zonaAsignada: payload.zona_asignada,
      nombreZona: payload.nombre_zona
    };
  } catch (error) {
    console.error('Error al decodificar el token JWT:', error);
    return null;
  }
};

const ReportesView: React.FC = () => {
  const navigate = useNavigate();
  const APIVOT = "https://devsoul.co/api_votantes"; // Mismo API que en el contexto

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
  const [fUsuario, setFUsuario] = useState("");
  
  // --- NUEVOS ESTADOS PARA LOS FILTROS ---
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
        // Si no hay token, redirigir al login
        navigate("/Admin_gold");
    }
  }, [navigate]);

// --- LÓGICA PRINCIPAL: Cargar datos según el rol del usuario (MODIFICADO) ---
const fetchReportData = async () => {
  if (!currentUser) return;

  setLoadingReport(true);
  setErrorReport(null);

  try {
    let url = `${APIVOT}/votantes_list.php?limit=10000`;

    // Lógica actualizada para los diferentes roles
    if (currentUser.rol_usuario === 2) {
      // Rol 2 (Super Admin): Carga todos los votantes sin filtros de usuario o zona.
      console.log("Rol: 2 (Super Admin). Cargando todos los votantes.");
    } else if (currentUser.rol_usuario === 1) {
      // Rol 1 (Supervisor/Jefe de Zona): Carga todos los votantes de su zona asignada.
      if (currentUser.zonaAsignada) {
        url += `&zona=${currentUser.zonaAsignada}`;
        console.log(`Rol: 1 (Supervisor). Cargando votantes de la zona asignada (ID: ${currentUser.zonaAsignada}).`);
      } else {
        console.warn("Usuario con rol 1 no tiene una zona asignada. No se pueden cargar datos.");
        setReportData([]); // No hay datos que mostrar
        return;
      }
    } else {
      // Rol estándar (u otros): Carga solo los votantes que él mismo registró.
      url += `&usuario=${currentUser.id}`;
      console.log("Usuario estándar. Cargando sus votantes asignados (ID:", currentUser.id, ")");
    }
    
    const res = await fetch(url);
    const data = await res.json();

    if (data?.success) {
      setReportData(data.data || []);
    } else {
      throw new Error(data?.error || "No se pudieron cargar los datos del reporte.");
    }
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

  // --- NUEVAS LISTAS DINÁMICAS PARA LOS FILTROS ---
  const usuariosUnicosEnDatos = useMemo(() => {
    const usuariosMap = new Map<string, number>();
    reportData.forEach(votante => {
      if (votante.USUARIO_NOMBRE && votante.USUARIO_NOMBRE !== 'SIN ASIGNAR') {
        if (!usuariosMap.has(votante.USUARIO_NOMBRE)) {
            usuariosMap.set(votante.USUARIO_NOMBRE, usuariosMap.size + 1);
        }
      }
    });
    return Array.from(usuariosMap.entries()).map(([nombre, id]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [reportData]);

  const departamentosUnicos = useMemo(() => {
    const departamentos = new Set(reportData.map(v => v.ZONA_NOMBRE).filter(Boolean));
    return Array.from(departamentos).sort();
  }, [reportData]);

  const municipiosUnicos = useMemo(() => {
    const municipios = new Set(reportData.map(v => v.MUNICIPIO).filter(Boolean));
    return Array.from(municipios).sort();
     console.log(municipiosUnicos); 
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

  // --- LÓGICA DE FILTRADO DEL LADO DEL CLIENTE (ACTUALIZADA) ---
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

    if (fUsuario) {
        const usuarioSeleccionado = usuariosUnicosEnDatos.find(u => String(u.id) === fUsuario);
        if (usuarioSeleccionado) {
            filtered = filtered.filter(votante => votante.USUARIO_NOMBRE === usuarioSeleccionado.nombre);
        }
    }

    // --- NUEVAS CONDICIONES DE FILTRADO ---
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
      // Sumamos un día a la fecha final para incluir registros de ese mismo día hasta la medianoche
      const fechaFinConUnDiaMas = new Date(fFechaFin);
      fechaFinConUnDiaMas.setDate(fechaFinConUnDiaMas.getDate() + 1);
      filtered = filtered.filter(votante => new Date(votante.CREADO_EN) < fechaFinConUnDiaMas);
    }

    return filtered;
  }, [reportData, q, fUsuario, usuariosUnicosEnDatos, fDepartamento, fMunicipio, fFechaInicio, fFechaFin]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [q, fUsuario, fDepartamento, fMunicipio, fFechaInicio, fFechaFin]);

  // Calcular resultados paginados a partir de los datos filtrados
  const resultadosPaginados = useMemo(() => {
    const indiceUltimoResultado = paginaActual * resultadosPorPagina;
    const indicePrimerResultado = indiceUltimoResultado - resultadosPorPagina;
    return datosFiltrados.slice(indicePrimerResultado, indiceUltimoResultado);
  }, [datosFiltrados, paginaActual]);

  // Total de páginas basado en los datos filtrados
  const totalPaginas = useMemo(() => {
    return Math.ceil(datosFiltrados.length / resultadosPorPagina);
  }, [datosFiltrados]);

  // --- FUNCIÓN PARA EXPORTAR A EXCEL (MODIFICADA) ---
  const descargarExcel = async () => {
    setExportandoExcel(true);
    try {
      const datos = datosFiltrados; // Usar los datos ya filtrados en el cliente

      if (datos.length === 0) {
        toast.warning("No hay datos para exportar");
        setExportandoExcel(false);
        return;
      }

      const workbook = XLSX.utils.book_new();

      // --- HOJA 1: DATOS ORIGINALES ---
      const datosExcel = datos.map((votante) => ({
        'ID': votante.ID_VOTANTE,
        'Documento': votante.NUM_DOC,
        'Nombre Completo': votante.NOMBRE_COMPLETO,
        'Departamento': votante.ZONA_NOMBRE,
        'Municipio': votante.MUNICIPIO,
        'Mesa': votante.MESA || 'N/A',
        'Lugar de Votación': votante.LUGAR_VOTACION || 'N/A', // Nuevo campo añadido
        'Usuario Asignado': votante.USUARIO_NOMBRE || 'SIN ASIGNAR',
        'Fecha de Registro': votante.CREADO_EN
      }));
      const worksheetOriginal = XLSX.utils.json_to_sheet(datosExcel);
      XLSX.utils.book_append_sheet(workbook, worksheetOriginal, "Reporte de Votantes");

      // --- HOJA 2: RESUMEN POR USUARIO ---
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

        const detailHeaders = ['DOCUMENTO', 'NOMBRE COMPLETO', 'DEPARTAMENTO', 'MUNICIPIO', 'MESA', 'LUGAR DE VOTACIÓN', 'FECHA DE REGISTRO']; // Añadidos MESA y LUGAR DE VOTACIÓN
        XLSX.utils.sheet_add_aoa(worksheetResumen, [detailHeaders], { origin: `A${currentRow + 1}` });
        
        detailHeaders.forEach((_, colIndex) => {
          const cellAddress = XLSX.utils.encode_cell({ r: currentRow, c: colIndex });
          if (!worksheetResumen[cellAddress]) return;
          worksheetResumen[cellAddress].s = detailHeaderStyle;
        });
        currentRow++;

        const voterData = votantesDelUsuario.map(v => [
          v.NUM_DOC, 
          v.NOMBRE_COMPLETO, 
          v.ZONA_NOMBRE, 
          v.MUNICIPIO, 
          v.MESA || 'N/A', // Añadido MESA
          v.LUGAR_VOTACION || 'N/A', // Añadido LUGAR_VOTACION
          v.CREADO_EN
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
        { wch: 20 },
        { wch: 25 },
        { wch: 10 }, // Columna para MESA
        { wch: 30 }, // Columna para LUGAR_VOTACION
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

  // Función para limpiar todos los filtros
  const limpiarFiltros = () => {
    setQ("");
    setFUsuario("");
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
              <h1 className="text-2xl font-bold text-slate-800">Módulo de Reportes</h1>
              <p className="text-sm text-slate-500 mt-1">
                Visualiza y exporta los datos de los votantes según tu rol y permisos.
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

            {/* Filtro por Departamento */}
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

            {/* Filtro por Municipio */}
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

            {/* Filtro por Fecha de Inicio */}
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="date"
                value={fFechaInicio}
                onChange={(e) => setFFechaInicio(e.target.value)}
                className="w-full pl-9 p-2.5 rounded-xl bg-white border border-slate-300 placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>

            {/* Filtro por Fecha de Fin */}
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

          {/* Filtro por Usuario Asignado (solo para rol 2) */}
          {currentUser?.rol_usuario === 2 && (
            <div className="relative mt-4">
              <select
                value={fUsuario}
                onChange={(e) => setFUsuario(e.target.value)}
                className="w-full appearance-none p-2.5 rounded-xl bg-white border border-slate-300 shadow-inner text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none pr-9"
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

export default ReportesView;