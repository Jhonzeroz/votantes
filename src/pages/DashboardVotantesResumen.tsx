import React, { useEffect, useState, useMemo } from "react";
import { BarChart3, UserPlus, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const APIVOT = "https://devsoul.co/api_votantes";

// --- TIPOS DE DATOS ---
type Resumen = {
  total_votantes: number;
  mesas_distintas: number;
  municipios_distintos: number;
  usuarios_distintos: number;
  puestos_distintos?: number;
  lugares_distintos?: number;
};

type PorZona = { ID_ZONA: number | null; ZONA: string | null; TOTAL: number };
type PorUsuario = { ID_USUARIO: number | null; USUARIO: string | null; TOTAL: number };
type VotanteDetalle = {
  DEPARTAMENTO: string;
  MUNICIPIO: string;
  ID_USUARIO_ASIGNADO: number;
  ID_ZONA_ASIGNADA: number;
  SOLO_CAMARA: string;
};
type VotantesPorMunicipioHomologado = {
  MUNICIPIO: string;
  DEPARTAMENTO: string;
  TOTAL: number;
};

// Tipo para la información del usuario, extraída del token
type UserInfoFromToken = {
  sub: number; // ID del usuario
  nombre: string;
  rol_usuario: "LIDER" | "1" | "2";
  zona_asignada: number;
  nombre_zona: string;
  iat: number;
  exp: number;
};

// Tipo para los últimos votantes registrados
type UltimoVotante = {
  NOMBRE_COMPLETO: string;
  DEPARTAMENTO: string;
  MUNICIPIO: string;
  USUARIO_NOMBRE: string;
  CREADO_EN: string;
};

// Tipo para contar solo los 'SI'
type CamaraPorDepartamento = {
  DEPARTAMENTO: string;
  CON_CAMARA: number;
};

// --- COMPONENTE PRINCIPAL ---
const DashboardVotantesResumen: React.FC = () => {
  // --- ESTADOS ---
  const [loadingMainData, setLoadingMainData] = useState(true);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [porZona, setPorZona] = useState<PorZona[]>([]);
  const [porUsuario, setPorUsuario] = useState<PorUsuario[]>([]);
  const [votantesDetalle, setVotantesDetalle] = useState<VotanteDetalle[]>([]);
  const [currentUser, setCurrentUser] = useState<UserInfoFromToken | null>(null);

  
     console.log(porZona); 
        console.log(resumen); 

  const [ultimosVotantes, setUltimosVotantes] = useState<UltimoVotante[]>([]);
  const [loadingUltimos, setLoadingUltimos] = useState(true);

  // --- ESTADO PARA DATOS DE CÁMARA POR DEPARTAMENTO ---
  const [camaraPorDepartamento, setCamaraPorDepartamento] = useState<CamaraPorDepartamento[]>([]);
  const [loadingCamara, setLoadingCamara] = useState(true);

  // --- LÓGICA DE AUTENTICACIÓN ---
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
        sub: payload.sub,
        nombre: payload.nombre,
        rol_usuario: payload.rol_usuario,
        zona_asignada: payload.zona_asignada,
        nombre_zona: payload.nombre_zona,
        iat: payload.iat,
        exp: payload.exp
      };
    } catch (error) {
      console.error('Error al decodificar el token JWT:', error);
      return null;
    }
  };

  // --- LÓGICA DE CÁLCULO CON useMemo ---
  const votantesPorMunicipioHomologado = useMemo(() => {
    const counts: { [key: string]: VotantesPorMunicipioHomologado } = {};
    votantesDetalle.forEach(votante => {
      const key = `${votante.DEPARTAMENTO}-${votante.MUNICIPIO}`;
      if (!counts[key]) {
        counts[key] = { DEPARTAMENTO: votante.DEPARTAMENTO, MUNICIPIO: votante.MUNICIPIO, TOTAL: 0 };
      }
      counts[key].TOTAL += 1;
    });
    return Object.values(counts).sort((a, b) => b.TOTAL - a.TOTAL);
  }, [votantesDetalle]);

  const votantesPorDepartamentoDesdeAPI = useMemo(() => {
    const deptoCounts: { [key: string]: number } = {};
    votantesPorMunicipioHomologado.forEach(item => {
      const depto = item.DEPARTAMENTO;
      if (depto) {
        deptoCounts[depto] = (deptoCounts[depto] || 0) + item.TOTAL;
      }
    });
    return Object.entries(deptoCounts).map(([departamento, total]) => ({ departamento, total })).sort((a, b) => b.total - a.total);
  }, [votantesPorMunicipioHomologado]);

  // --- EFECTOS Y CARGA DE DATOS ---
  useEffect(() => {
    const userInfo = getCurrentUserInfo();
    if (userInfo) {
      setCurrentUser(userInfo);
    } else {
      toast.error("No se encontró el token de autenticación o es inválido.");
    }
  }, []);


  


  const loadDashboard = async () => {
    if (!currentUser) return;

    const user = currentUser;
    
    setLoadingMainData(true);
    setLoadingUltimos(true);
    setLoadingCamara(true);

    try {
      const params = new URLSearchParams();
      params.set("_t", String(Date.now()));
      
      // --- LÓGICA CLAVE: Ajustar los parámetros según el rol ---
      // Los líderes y rol 1 filtran por su ID.
      // Los Admins (rol 2) no filtran para ver todo.
      if (user.rol_usuario === "LIDER" || user.rol_usuario === "1") {
        params.set("id_usuario", String(user.sub));
      }

      const [res, resDetalle, resUltimos, resCamara] = await Promise.all([
        fetch(`${APIVOT}/dashboard_counts.php?${params.toString()}`).then(r => r.json()),
        fetch(`${APIVOT}/votantes_detalle.php?${params.toString()}`).then(r => r.json()),
        fetch(`${APIVOT}/ultimos_votantes.php?${params.toString()}`).then(r => r.json()),
        // Para el API de cámara, se usan los mismos parámetros.
        // Si es admin, no se enviará 'id_usuario'.
        fetch(`${APIVOT}/votante_camara.php?${params.toString()}`).then(r => r.json()),
      ]);

      if (res?.success) {
        setResumen(res.data.resumen || null);
        setPorZona(res.data.por_zona || []);
        setPorUsuario(res.data.por_usuario || []);
      } else {
        toast.error(res?.error || "No se pudo cargar el dashboard principal");
      }

      // --- CAMBIO CLAVE AQUÍ ---
      if (resDetalle?.success) {
        // Filtramos los datos para excluir a los que tienen SOLO_CAMARA en "SI"
        const filteredDetalle = (resDetalle.data || []).filter((votante: VotanteDetalle) => votante.SOLO_CAMARA !== "SI");
        setVotantesDetalle(filteredDetalle);
      } else {
        toast.error(resDetalle?.message || "No se pudo cargar los detalles de los votantes");
      }
      // --- FIN DEL CAMBIO ---
      
      if (resUltimos?.success) {
        setUltimosVotantes(resUltimos.data || []);
      } else {
        toast.error(resUltimos?.message || "No se pudo cargar los últimos votantes");
      }

      if (resCamara?.success) {
        const camaraData: { [key: string]: CamaraPorDepartamento } = {};
        
        resCamara.data.forEach((votante: any) => {
          const depto = votante.DEPARTAMENTO;
          if (!depto) return;

          if (votante.CAMARA === 'SI') {
            if (!camaraData[depto]) {
              camaraData[depto] = {
                DEPARTAMENTO: depto,
                CON_CAMARA: 0
              };
            }
            camaraData[depto].CON_CAMARA += 1;
          }
        });
        
        setCamaraPorDepartamento(Object.values(camaraData).sort((a, b) => b.CON_CAMARA - a.CON_CAMARA));
      } else {
        toast.error(resCamara?.message || "No se pudo cargar los datos de cámara");
      }
    } catch (error) {
      console.error("Error en loadDashboard:", error);
      toast.error("Error de red o al procesar la respuesta");
    } finally {
      setLoadingMainData(false);
      setLoadingUltimos(false);
      setLoadingCamara(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadDashboard();
    }
  }, [currentUser]);



  // --- FUNCIONES AUXILIARES ---
  const getGradientColor = (index: number) => {
    const gradients = ["from-blue-400 to-indigo-500", "from-emerald-400 to-teal-500", "from-purple-400 to-pink-500", "from-amber-400 to-orange-500", "from-rose-400 to-red-500", "from-cyan-400 to-sky-500", "from-violet-400 to-purple-700", "from-teal-400 to-green-500"];
    return gradients[index % gradients.length];
  };

  const getDashboardTitle = () => {
    if (!currentUser) return "Dashboard de Votantes";
    switch (currentUser.rol_usuario) {
      case "LIDER": return `Dashboard - ${currentUser.nombre} (Líder)`;
      case "1": return `Dashboard - ${currentUser.nombre} (Líder Departamento)`;
      case "2": return `Dashboard - ${currentUser.nombre} (Admin)`;
      default: return "Dashboard de Votantes";
    }
  };

  // --- RENDERIZADO ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Encabezado */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{getDashboardTitle()}</h2>
          {currentUser && (currentUser.rol_usuario === "LIDER" || currentUser?.rol_usuario === "1") && (
            <p className="text-sm text-slate-500 mt-1">
              Viendo información de los votantes asignados a usted.
            </p>
          )}
        </div>
        <Link to="/dashboard" className="group relative flex items-center gap-2 px-4 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow-[0_6px_14px_-6px_rgba(37,99,235,0.6)] hover:shadow-[0_10px_20px_-6px_rgba(37,99,235,0.7)] transition-all duration-200 ease-out hover:-translate-y-0.5">
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"><span className="absolute -left-10 top-0 h-full w-16 -skew-x-12 bg-white/25 opacity-0 transition-all duration-500 group-hover:translate-x-[140%] group-hover:opacity-100" /></span>
          <UserPlus className="w-4 h-4 opacity-90" /> Nuevo Votante
        </Link>
      </div>

      {/* --- NUEVO LAYOUT: Tarjetas de Departamentos y Total --- */}
      <div className="px-6 mt-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Tarjetas de Votantes por Departamento (ahora ocupan 2 columnas) */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loadingMainData ? ([...Array(8)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-slate-200 animate-pulse"></div>)) : (
              votantesPorDepartamentoDesdeAPI.length > 0 ? (
                votantesPorDepartamentoDesdeAPI.map((depto, index) => (
                  <div key={depto.departamento} className={`p-4 rounded-2xl text-white shadow-md bg-gradient-to-br ${getGradientColor(index)}`}>
                    <div className="flex items-center gap-2 text-sm opacity-90"><TrendingUp className="w-4 h-4" /> {depto.departamento}</div>
                    <div className="text-3xl font-bold mt-1">{depto.total.toLocaleString()}</div>
                    <div className="text-xs opacity-75 mt-1">{((depto.total / (votantesDetalle.length || 1)) * 100).toFixed(1)}% del total</div>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-8 text-center text-slate-500 bg-slate-100 rounded-xl">
                  {(currentUser?.rol_usuario === "LIDER" || currentUser?.rol_usuario === "1") ? "No tiene votantes asignados." : "No hay votantes registrados."}
                </div>
              )
            )}
          </div>
        </div>

        {/* Tarjeta de Total Votantes (ahora ocupa 1 columna al lado) */}
        <div className="lg:col-span-1">
          <div className="p-6 rounded-2xl text-white shadow-md bg-gradient-to-br from-indigo-500 to-purple-600 h-full flex flex-col justify-between">
            <div className="flex items-center gap-2 text-sm opacity-90"><BarChart3 className="w-4 h-4" /> Total de Votantes</div>
            <div className="text-4xl font-bold mt-2">{votantesDetalle.length.toLocaleString()}</div>
          </div>
        </div>

{currentUser && (currentUser.rol_usuario === "LIDER" || currentUser.rol_usuario === "1" || currentUser.rol_usuario === "2") && (
  <div className="lg:col-span-1">
    <div className="p-6 rounded-2xl text-white shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 h-full flex flex-col justify-between">
      <div className="flex items-center gap-2 text-sm opacity-90">
        <TrendingUp className="w-4 h-4" /> 
        Votantes que SÍ registran para Cámara
      </div>
      
      {loadingCamara ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-3 overflow-auto max-h-64">
            {camaraPorDepartamento.length > 0 ? (
              camaraPorDepartamento.slice(0, 6).map((departamento, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-white/20 last:border-b-0">
                  <span className="text-sm font-medium text-white/90 truncate pr-2">{departamento.DEPARTAMENTO}</span>
                  <span className="text-sm font-bold bg-white/20 px-2 py-1 rounded-full">
                    {departamento.CON_CAMARA.toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-white/70 py-8">
                No hay votantes registrados para Cámara.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  </div>
)}
      </div>

      {/* Grids de tablas */}
      <div className="px-6 mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6 pb-10">
        {/* Votantes por municipio con departamento */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50"><h4 className="font-semibold text-emerald-700">Votantes por Municipio</h4></div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700"><tr><th className="text-left px-3 py-2 font-medium">Municipio</th><th className="text-left px-3 py-2 font-medium">Departamento</th><th className="text-left px-3 py-2 font-medium">Total</th></tr></thead>
              <tbody>
                {loadingMainData ? ([...Array(5)].map((_, i) => <tr key={i}><td colSpan={3} className="px-3 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse"></div></td></tr>)) : (
                  votantesPorMunicipioHomologado.length === 0 ? (
                    <tr><td colSpan={3} className="px-3 py-6 text-center text-slate-400">{(currentUser?.rol_usuario === "LIDER" || currentUser?.rol_usuario === "1") ? "Sin datos para sus votantes asignados." : "Sin datos"}</td></tr>
                  ) : (
                    votantesPorMunicipioHomologado.map((r, i) => (
                      <tr key={i} className="border-t border-slate-100 hover:bg-emerald-50/60">
                        <td className="px-3 py-2 font-medium">{r.MUNICIPIO}</td>
                        <td className="px-3 py-2 text-xs text-slate-600">{r.DEPARTAMENTO}</td>
                        <td className="px-3 py-2 font-semibold text-slate-800">{r.TOTAL}</td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- CAMBIO AQUÍ: Tarjeta de Votantes por usuario --- */}
        {currentUser?.rol_usuario === "2" && (
          <div className="rounded-2xl bg-white border border-violet-200 shadow-md overflow-hidden">
            <div className="p-5 border-b border-violet-100 bg-violet-50">
              <h4 className="font-semibold text-violet-700">Votantes por usuario</h4>
            </div>
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-violet-50 text-violet-700"><tr><th className="text-left px-3 py-2 font-medium">Usuario</th><th className="text-left px-3 py-2 font-medium">Total</th></tr></thead>
                <tbody>
                  {loadingMainData ? ([...Array(5)].map((_, i) => <tr key={i}><td colSpan={2} className="px-3 py-4"><div className="h-4 bg-slate-200 rounded animate-pulse"></div></td></tr>)) : (
                    porUsuario.length === 0 ? (
                      <tr><td colSpan={2} className="px-3 py-6 text-center text-slate-400">Sin datos</td></tr>
                    ) : (
                      porUsuario.map((r, i) => (
                        <tr key={i} className="border-t border-slate-100 hover:bg-violet-50/60">
                          <td className="px-3 py-2">{r.USUARIO ?? "—"}</td>
                          <td className="px-3 py-2 font-semibold text-violet-700">{r.TOTAL}</td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tarjeta de Votantes por Departamento */}
        <div className="rounded-2xl bg-white border border-blue-200 shadow-md overflow-hidden">
          <div className="p-5 border-b border-blue-100 bg-blue-50">
            <h4 className="font-semibold text-blue-700">Votantes por Departamento</h4>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-blue-50 text-blue-700">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Departamento</th>
                  <th className="text-left px-3 py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {loadingMainData ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={2} className="px-3 py-4">
                        <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  votantesPorDepartamentoDesdeAPI.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-3 py-6 text-center text-slate-400">
                        {(currentUser?.rol_usuario === "LIDER" || currentUser?.rol_usuario === "1") ? "Sin datos para sus votantes asignados." : "Sin datos"}
                      </td>
                    </tr>
                  ) : (
                    votantesPorDepartamentoDesdeAPI.map((r, i) => (
                      <tr key={i} className="border-t border-slate-100 hover:bg-blue-50/60">
                        <td className="px-3 py-2 font-medium">{r.departamento}</td>
                        <td className="px-3 py-2 font-semibold text-blue-700">{r.total}</td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN DE ÚLTIMOS 10 REGISTRADOS --- */}
      <div className="px-6 pb-10">
        <div className="rounded-2xl bg-white border border-orange-200 shadow-md overflow-hidden">
          <div className="p-5 border-b border-orange-100 bg-orange-50">
            <h4 className="font-semibold text-orange-700">Últimos 10 Registrados</h4>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-orange-50 text-orange-700">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Nombre</th>
                  <th className="text-left px-3 py-2 font-medium">Departamento</th>
                  <th className="text-left px-3 py-2 font-medium">Municipio</th>
                  <th className="text-left px-3 py-2 font-medium">Usuario</th>
                </tr>
              </thead>
              <tbody>
                {loadingUltimos ? (
                  [...Array(10)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={4} className="px-3 py-4">
                        <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  ultimosVotantes.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                        {(currentUser?.rol_usuario === "LIDER" || currentUser?.rol_usuario === "1") ? "Sin datos para sus votantes asignados." : "Sin datos"}
                      </td>
                    </tr>
                  ) : (
                    ultimosVotantes.map((r, i) => (
                      <tr key={i} className="border-t border-slate-100 hover:bg-orange-50/60">
                        <td className="px-3 py-2 font-medium">{r.NOMBRE_COMPLETO}</td>
                        <td className="px-3 py-2 text-xs text-slate-600">{r.DEPARTAMENTO}</td>
                        <td className="px-3 py-2 text-xs text-slate-600">{r.MUNICIPIO}</td>
                        <td className="px-3 py-2 text-xs text-slate-600">{r.USUARIO_NOMBRE}</td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardVotantesResumen;