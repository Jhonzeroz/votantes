import React, { useEffect, useState, useMemo } from "react";
import { BarChart3,UserPlus,  Users,  TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const APIVOT = "https://datainsightscloud.com/Apis";


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
type VotantesPorMunicipioHomologado = {
  MUNICIPIO: string;
  DEPARTAMENTO: string;
  TOTAL: number;
};

const DashboardVotantesResumen: React.FC = () => {

  const [loadingMainData, setLoadingMainData] = useState(true); // Estado de carga para los datos principales
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [porZona, setPorZona] = useState<PorZona[]>([]);
  const [porUsuario, setPorUsuario] = useState<PorUsuario[]>([]);
  const [votantesPorMunicipioHomologado, setVotantesPorMunicipioHomologado] = useState<VotantesPorMunicipioHomologado[]>([]);

  // --- LÓGICA DE CÁLCULO ---
  const votantesPorDepartamentoDesdeAPI = useMemo(() => {
    const deptoCounts: { [key: string]: number } = {};
    votantesPorMunicipioHomologado.forEach(item => {
      const depto = item.DEPARTAMENTO;
      if (depto) {
        deptoCounts[depto] = (deptoCounts[depto] || 0) + item.TOTAL;
      }
    });
    const result = Object.entries(deptoCounts).map(([departamento, total]) => ({
      departamento,
      total
    }));
    return result.sort((a, b) => b.total - a.total);
  }, [votantesPorMunicipioHomologado]);

  // --- EFECTOS Y CARGA DE DATOS ---
  useEffect(() => {
    (async () => {
      try {
        const [] = await Promise.all([
          fetch(`${APIVOT}/municipios_list.php`).then((r) => r.json()),
          fetch(`${APIVOT}/zonas_list.php`).then((r) => r.json()),
          fetch(`${APIVOT}/usuarios_list.php`).then((r) => r.json()),
        ]);
    
      } catch {
        // silencioso
      }
    })();
  }, []);

  const loadDashboard = async () => {
    setLoadingMainData(true);
    try {
      const params = new URLSearchParams();
      params.set("_t", String(Date.now()));

      const [res, resHomologado] = await Promise.all([
        fetch(`${APIVOT}/dashboard_counts.php?${params.toString()}`).then((r) => r.json()),
        fetch(`${APIVOT}/votantes_por_municipio.php?${params.toString()}`).then((r) => r.json()),
      ]);

      if (res?.success) {
        setResumen(res.data.resumen || null);
        setPorZona(res.data.por_zona || []);
        setPorUsuario(res.data.por_usuario || []);
      } else {
        toast.error(res?.error || "No se pudo cargar el dashboard principal");
      }

      if (resHomologado?.success) {
        setVotantesPorMunicipioHomologado(resHomologado.data || []);
      } else {
        toast.error(resHomologado?.message || "No se pudo cargar los datos homologados por municipio");
      }
    } catch (error) {
      console.error("Error en loadDashboard:", error);
      toast.error("Error de red o al procesar la respuesta");
    } finally {
      setLoadingMainData(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);


  const getGradientColor = (index: number) => {
    const gradients = [
      "from-blue-400 to-indigo-500", "from-emerald-400 to-teal-500", "from-purple-400 to-pink-500",
      "from-amber-400 to-orange-500", "from-rose-400 to-red-500", "from-cyan-400 to-sky-500",
      "from-violet-400 to-purple-700", "from-teal-400 to-green-500"
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Encabezado */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Dashboard de Votantes</h2>
         
        </div>
        <Link
          to="/dashboard"
          className="group relative flex items-center gap-2 px-4 h-10 rounded-xl
               bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium
               shadow-[0_6px_14px_-6px_rgba(37,99,235,0.6)]
               hover:shadow-[0_10px_20px_-6px_rgba(37,99,235,0.7)]
               transition-all duration-200 ease-out hover:-translate-y-0.5"
        >
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
            <span className="absolute -left-10 top-0 h-full w-16 -skew-x-12
                       bg-white/25 opacity-0 transition-all duration-500
                       group-hover:translate-x-[140%] group-hover:opacity-100" />
          </span>
          <UserPlus className="w-4 h-4 opacity-90" />
          Nuevo Votante
        </Link>
      </div>

      {/* SECCIÓN PRINCIPAL: Votantes por Departamento */}
      <div className="px-6 mt-8">
 
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loadingMainData ? (
            // Esqueletos de carga
            [...Array(8)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-200 animate-pulse"></div>
            ))
          ) : (
            votantesPorDepartamentoDesdeAPI.length > 0 ? (
              votantesPorDepartamentoDesdeAPI.map((depto, index) => (
                <div key={depto.departamento} className={`p-4 rounded-2xl text-white shadow-md bg-gradient-to-br ${getGradientColor(index)}`}>
                  <div className="flex items-center gap-2 text-sm opacity-90">
                    <TrendingUp className="w-4 h-4" /> {depto.departamento}
                  </div>
                  <div className="text-3xl font-bold mt-1">{depto.total.toLocaleString()}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {((depto.total / (resumen?.total_votantes || 1)) * 100).toFixed(1)}% del total
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-8 text-center text-slate-500 bg-slate-100 rounded-xl">
              </div>
            )
          )}
        </div>
      </div>

      {/* Grids de tablas */}
      <div className="px-6 mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6 pb-10">
        {/* Votantes por municipio con departamento */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
            <h4 className="font-semibold text-emerald-700">Votantes por Municipio</h4>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Municipio</th>
                  <th className="text-left px-3 py-2 font-medium">Departamento</th>
                  <th className="text-left px-3 py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {loadingMainData ? (
                  // Esqueletos de carga para la tabla
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={3} className="px-3 py-4">
                        <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  votantesPorMunicipioHomologado.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-slate-400">Sin datos</td>
                    </tr>
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

        {/* Votantes por usuario */}
        <div className="rounded-2xl bg-white border border-violet-200 shadow-md overflow-hidden">
          <div className="p-5 border-b border-violet-100 bg-violet-50">
            <h4 className="font-semibold text-violet-700">Votantes por usuario</h4>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-violet-50 text-violet-700">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Usuario</th>
                  <th className="text-left px-3 py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {loadingMainData ? (
                  // Esqueletos de carga para la tabla
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={2} className="px-3 py-4">
                        <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  porUsuario.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-3 py-6 text-center text-slate-400">Sin datos</td>
                    </tr>
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

        {/* Votantes por zona - Nueva tabla añadida */}
        <div className="rounded-2xl bg-white border border-blue-200 shadow-md overflow-hidden">
          <div className="p-5 border-b border-blue-100 bg-blue-50">
            <h4 className="font-semibold text-blue-700">Votantes por zona</h4>
          </div>
          <div className="max-h-[420px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-blue-50 text-blue-700">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Zona</th>
                  <th className="text-left px-3 py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {loadingMainData ? (
                  // Esqueletos de carga para la tabla
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={2} className="px-3 py-4">
                        <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  porZona.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-3 py-6 text-center text-slate-400">Sin datos</td>
                    </tr>
                  ) : (
                    porZona.map((r, i) => (
                      <tr key={i} className="border-t border-slate-100 hover:bg-blue-50/60">
                        <td className="px-3 py-2">{r.ZONA ?? "—"}</td>
                        <td className="px-3 py-2 font-semibold text-blue-700">{r.TOTAL}</td>
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

       <div className="lg:col-span-4 flex gap-3">
              <div className="flex-1 p-3 rounded-xl text-white shadow-md bg-gradient-to-br from-emerald-400 to-green-500">
                <div className="flex items-center gap-2 text-xs opacity-90">
                  <BarChart3 className="w-3 h-3" /> Total votantes
                </div>
                <div className="text-2xl font-bold mt-1">{resumen?.total_votantes ?? 0}</div>
              </div>
              <div className="flex-1 p-3 rounded-xl text-white shadow-md bg-gradient-to-br from-amber-400 to-orange-500">
                <div className="flex items-center gap-2 text-xs opacity-90">
                  <Users className="w-3 h-3" /> Usuarios
                </div>
                <div className="text-2xl font-bold mt-1">{resumen?.usuarios_distintos ?? 0}</div>
              </div>
            </div>
    </div>
  );
};

export default DashboardVotantesResumen;