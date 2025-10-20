import React, { useEffect, useState } from "react";
import { BarChart3, Layers, UserPlus, MapPin, Users, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const APIVOT = "https://datainsightscloud.com/Apis";

type Opt = { id: number; nombre: string };

type Resumen = {
    total_votantes: number;
    mesas_distintas: number;
    zonas_distintas: number;
    municipios_distintos: number;
    usuarios_distintos: number;
    // NUEVOS (opcionales, si los devuelve tu API)
    puestos_distintos?: number;
    lugares_distintos?: number;
};

type PorMesa = { ID_ZONA: number; ZONA: string; MESA: number; TOTAL: number };
type PorZona = { ID_ZONA: number; ZONA: string; TOTAL: number };
type PorMpio = { ID_MUNICIPIO: number; MUNICIPIO: string; TOTAL: number };
type PorUsuario = { ID_USUARIO: number; USUARIO: string; TOTAL: number };

const DashboardVotantesResumen: React.FC = () => {
    const [municipios, setMunicipios] = useState<Opt[]>([]);
    const [zonas, setZonas] = useState<Opt[]>([]);
    const [usuarios, setUsuarios] = useState<Opt[]>([]);

    const [fMunicipio, setFMunicipio] = useState("");
    const [fZona, setFZona] = useState("");
    const [fUsuario, setFUsuario] = useState("");
    const [fMesa, setFMesa] = useState("");
    // NUEVOS FILTROS
    const [fPuesto, setFPuesto] = useState("");
    const [fLugar, setFLugar] = useState("");

    const [desde, setDesde] = useState("");
    const [hasta, setHasta] = useState("");

    const [loading, setLoading] = useState(false);
    const [resumen, setResumen] = useState<Resumen | null>(null);
    const [porMesa, setPorMesa] = useState<PorMesa[]>([]);
    const [porZona, setPorZona] = useState<PorZona[]>([]);
    const [porMpio, setPorMpio] = useState<PorMpio[]>([]);
    const [porUsuario, setPorUsuario] = useState<PorUsuario[]>([]);

    // Combos básicos
    useEffect(() => {
        (async () => {
            try {
                const [rM, rZ, rU] = await Promise.all([
                    fetch(`${APIVOT}/municipios_list.php`).then((r) => r.json()),
                    fetch(`${APIVOT}/zonas_list.php`).then((r) => r.json()),
                    fetch(`${APIVOT}/usuarios_list.php`).then((r) => r.json()),
                ]);
                if (rM?.success) setMunicipios(rM.data || []);
                if (rZ?.success) setZonas(rZ.data || []);
                if (rU?.success) setUsuarios(rU.data || []);
            } catch {
                // silencioso
            }
        })();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (fMunicipio) params.set("municipio", fMunicipio);
            if (fZona) params.set("zona", fZona);
            if (fUsuario) params.set("usuario", fUsuario);
            if (fMesa) params.set("mesa", fMesa);
            if (fPuesto) params.set("puesto", fPuesto); // NUEVO
            if (fLugar) params.set("lugar_votacion", fLugar); // NUEVO
            if (desde) params.set("desde", desde);
            if (hasta) params.set("hasta", hasta);

            const res = await fetch(
                `${APIVOT}/dashboard_counts.php?${params.toString()}`
            ).then((r) => r.json());

            if (res?.success) {
                setResumen(res.data.resumen);
                setPorMesa(res.data.por_mesa || []);
                setPorZona(res.data.por_zona || []);
                setPorMpio(res.data.por_municipio || []);
                setPorUsuario(res.data.por_usuario || []);
            } else {
                toast.error(res?.error || "No se pudo cargar el dashboard");
            }
        } catch {
            toast.error("Error de red");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []); // carga inicial

    const mesas100 = Array.from({ length: 100 }, (_, i) => String(i + 1));

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            {/* Encabezado */}
            <div className="px-6 pt-8 pb-4 flex items-center justify-between">
                {/* Título */}
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Dashboard de Votantes</h2>
                    <p className="text-sm text-slate-500">
                        Conteos por mesa, zona, municipio y usuario
                    </p>
                </div>

                {/* Botón Nuevo Votante */}
                <Link
                    to="/dashboard"
                    className="group relative flex items-center gap-2 px-4 h-10 rounded-xl
               bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium
               shadow-[0_6px_14px_-6px_rgba(37,99,235,0.6)]
               hover:shadow-[0_10px_20px_-6px_rgba(37,99,235,0.7)]
               transition-all duration-200 ease-out hover:-translate-y-0.5"
                >
                    {/* Brillo diagonal */}
                    <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                        <span className="absolute -left-10 top-0 h-full w-16 -skew-x-12
                       bg-white/25 opacity-0 transition-all duration-500
                       group-hover:translate-x-[140%] group-hover:opacity-100" />
                    </span>

                    <UserPlus className="w-4 h-4 opacity-90" />
                    Nuevo Votante
                </Link>
            </div>

            {/* Filtros */}
            <div className="px-6">
                {/* Contenedor con fondo suave y borde */}
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 via-indigo-50 to-violet-50 p-4 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-8 gap-3">
                        <select
                            value={fMunicipio}
                            onChange={(e) => setFMunicipio(e.target.value)}
                            className="h-10 rounded-xl bg-white/90 border border-slate-200 px-3 text-sm shadow-sm
                   focus:outline-none focus:ring-4 focus:ring-sky-200 focus:border-sky-300 hover:border-sky-300"
                            aria-label="Municipio"
                        >
                            <option value="">Todos los municipios</option>
                            {municipios.map((m) => (
                                <option key={m.id} value={String(m.id)}>
                                    {m.nombre}
                                </option>
                            ))}
                        </select>

                        <select
                            value={fZona}
                            onChange={(e) => setFZona(e.target.value)}
                            className="h-10 rounded-xl bg-white/90 border border-slate-200 px-3 text-sm shadow-sm
                   focus:outline-none focus:ring-4 focus:ring-violet-200 focus:border-violet-300 hover:border-violet-300"
                            aria-label="Zona"
                        >
                            <option value="">Todas las zonas</option>
                            {zonas.map((z) => (
                                <option key={z.id} value={String(z.id)}>
                                    {z.nombre}
                                </option>
                            ))}
                        </select>

                        <select
                            value={fUsuario}
                            onChange={(e) => setFUsuario(e.target.value)}
                            className="h-10 rounded-xl bg-white/90 border border-slate-200 px-3 text-sm shadow-sm
                   focus:outline-none focus:ring-4 focus:ring-emerald-200 focus:border-emerald-300 hover:border-emerald-300"
                            aria-label="Usuario"
                        >
                            <option value="">Todos los usuarios</option>
                            {usuarios.map((u) => (
                                <option key={u.id} value={String(u.id)}>
                                    {u.nombre}
                                </option>
                            ))}
                        </select>

                        {/* Mesa 1..100 */}
                        <select
                            value={fMesa}
                            onChange={(e) => setFMesa(e.target.value)}
                            className="h-10 rounded-xl bg-white/90 border border-slate-200 px-3 text-sm shadow-sm
                   focus:outline-none focus:ring-4 focus:ring-amber-200 focus:border-amber-300 hover:border-amber-300"
                            aria-label="Mesa"
                        >
                            <option value="">Todas las mesas</option>
                            {mesas100.map((n) => (
                                <option key={n} value={n}>
                                    Mesa {n}
                                </option>
                            ))}
                        </select>

                        {/* NUEVOS FILTROS */}
                        <input
                            value={fPuesto}
                            onChange={(e) => setFPuesto(e.target.value)}
                            placeholder="Puesto (ej: I.E. Central)"
                            className="h-10 rounded-xl bg-white/90 border border-slate-200 px-3 text-sm shadow-sm
                   focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-300 hover:border-blue-300"
                            aria-label="Puesto"
                        />
                        <input
                            value={fLugar}
                            onChange={(e) => setFLugar(e.target.value)}
                            placeholder="Lugar de votación (ej: Montería)"
                            className="h-10 rounded-xl bg-white/90 border border-slate-200 px-3 text-sm shadow-sm
                   focus:outline-none focus:ring-4 focus:ring-rose-200 focus:border-rose-300 hover:border-rose-300"
                            aria-label="Lugar de votación"
                        />

                        <input
                            type="date"
                            value={desde}
                            onChange={(e) => setDesde(e.target.value)}
                            className="h-10 rounded-xl bg-white/90 border border-slate-200 px-3 text-sm shadow-sm
                   focus:outline-none focus:ring-4 focus:ring-indigo-200 focus:border-indigo-300 hover:border-indigo-300"
                            aria-label="Desde"
                        />
                        <input
                            type="date"
                            value={hasta}
                            onChange={(e) => setHasta(e.target.value)}
                            className="h-10 rounded-xl bg-white/90 border border-slate-200 px-3 text-sm shadow-sm
                   focus:outline-none focus:ring-4 focus:ring-rose-200 focus:border-rose-300 hover:border-rose-300"
                            aria-label="Hasta"
                        />
                    </div>

                    {/* Acciones */}
                    <div className="mt-4 flex items-center gap-3">
                        <button
                            onClick={loadDashboard}
                            className="px-4 h-10 rounded-xl text-white text-sm font-medium shadow-md
                   bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
                   focus:outline-none focus:ring-4 focus:ring-indigo-200"
                        >
                            {loading ? "Cargando..." : "Aplicar filtros"}
                        </button>

                        <button
                            onClick={() => {
                                setFMunicipio("");
                                setFZona("");
                                setFUsuario("");
                                setFMesa("");
                                setFPuesto("");
                                setFLugar("");
                                setDesde("");
                                setHasta("");
                                setTimeout(loadDashboard, 0);
                            }}
                            className="px-4 h-10 rounded-xl text-sm font-medium
                   bg-white/90 border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm
                   focus:outline-none focus:ring-4 focus:ring-slate-200"
                        >
                            Limpiar
                        </button>
                    </div>
                </div>
            </div>

            {/* Resumen con color */}
            <div className="px-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    <div className="p-4 rounded-2xl text-white shadow-md bg-gradient-to-br from-emerald-400 to-green-500">
                        <div className="flex items-center gap-2 text-sm opacity-90">
                            <BarChart3 className="w-4 h-4" /> Total votantes
                        </div>
                        <div className="text-3xl font-bold mt-1">{resumen?.total_votantes ?? 0}</div>
                    </div>

                    <div className="p-4 rounded-2xl text-white shadow-md bg-gradient-to-br from-blue-400 to-indigo-500">
                        <div className="flex items-center gap-2 text-sm opacity-90">
                            <Layers className="w-4 h-4" /> Mesas
                        </div>
                        <div className="text-3xl font-bold mt-1">{resumen?.mesas_distintas ?? 0}</div>
                    </div>

                    <div className="p-4 rounded-2xl text-white shadow-md bg-gradient-to-br from-purple-400 to-fuchsia-500">
                        <div className="flex items-center gap-2 text-sm opacity-90">
                            <Layers className="w-4 h-4" /> Zonas
                        </div>
                        <div className="text-3xl font-bold mt-1">{resumen?.zonas_distintas ?? 0}</div>
                    </div>

                    <div className="p-4 rounded-2xl text-white shadow-md bg-gradient-to-br from-pink-400 to-rose-500">
                        <div className="flex items-center gap-2 text-sm opacity-90">
                            <MapPin className="w-4 h-4" /> Municipios
                        </div>
                        <div className="text-3xl font-bold mt-1">{resumen?.municipios_distintos ?? 0}</div>
                    </div>

                    <div className="p-4 rounded-2xl text-white shadow-md bg-gradient-to-br from-amber-400 to-orange-500">
                        <div className="flex items-center gap-2 text-sm opacity-90">
                            <Users className="w-4 h-4" /> Usuarios
                        </div>
                        <div className="text-3xl font-bold mt-1">{resumen?.usuarios_distintos ?? 0}</div>
                    </div>

                    {/* NUEVAS TARJETAS (opcionales) */}
                    <div className="p-4 rounded-2xl text-white shadow-md bg-gradient-to-br from-cyan-400 to-sky-500">
                        <div className="flex items-center gap-2 text-sm opacity-90">
                            <Building2 className="w-4 h-4" /> Puestos
                        </div>
                        <div className="text-3xl font-bold mt-1">{resumen?.puestos_distintos ?? 0}</div>
                    </div>

                    <div className="p-4 rounded-2xl text-white shadow-md bg-gradient-to-br from-teal-400 to-emerald-500">
                        <div className="flex items-center gap-2 text-sm opacity-90">
                            <MapPin className="w-4 h-4" /> Lugares
                        </div>
                        <div className="text-3xl font-bold mt-1">{resumen?.lugares_distintos ?? 0}</div>
                    </div>
                </div>
            </div>

            {/* Tablas siguen igual (blanco empresarial) */}
            <div className="px-6 mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6 pb-10">
                {/* Por mesa */}
                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50">
                        <h4 className="font-semibold text-slate-700">Votantes por mesa (por zona)</h4>
                    </div>
                    <div className="max-h-[420px] overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-slate-50 text-slate-600">
                                <tr>
                                    <th className="text-left px-3 py-2 font-medium">Zona</th>
                                    <th className="text-left px-3 py-2 font-medium">Mesa</th>
                                    <th className="text-left px-3 py-2 font-medium">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {porMesa.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-3 py-6 text-center text-slate-400">Sin datos</td>
                                    </tr>
                                ) : (
                                    porMesa.map((r, i) => (
                                        <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                                            <td className="px-3 py-2">{r.ZONA}</td>
                                            <td className="px-3 py-2">Mesa {r.MESA}</td>
                                            <td className="px-3 py-2 font-semibold text-slate-800">{r.TOTAL}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Por zona */}
                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-gray-50">
                        <h4 className="font-semibold text-slate-700">Votantes por zona</h4>
                    </div>
                    <div className="max-h-[420px] overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-50 text-slate-600">
                                <tr>
                                    <th className="text-left px-3 py-2 font-medium">Zona</th>
                                    <th className="text-left px-3 py-2 font-medium">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {porZona.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-3 py-6 text-center text-slate-400">Sin datos</td>
                                    </tr>
                                ) : (
                                    porZona.map((r, i) => (
                                        <tr key={i} className="border-t border-slate-100 hover:bg-gray-50">
                                            <td className="px-3 py-2">{r.ZONA}</td>
                                            <td className="px-3 py-2 font-semibold text-slate-800">{r.TOTAL}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Por municipio */}
                <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-stone-50">
                        <h4 className="font-semibold text-slate-700">Votantes por municipio</h4>
                    </div>
                    <div className="max-h-[420px] overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-stone-50 text-slate-600">
                                <tr>
                                    <th className="text-left px-3 py-2 font-medium">Municipio</th>
                                    <th className="text-left px-3 py-2 font-medium">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {porMpio.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-3 py-6 text-center text-slate-400">Sin datos</td>
                                    </tr>
                                ) : (
                                    porMpio.map((r, i) => (
                                        <tr key={i} className="border-t border-slate-100 hover:bg-stone-50">
                                            <td className="px-3 py-2">{r.MUNICIPIO}</td>
                                            <td className="px-3 py-2 font-semibold text-slate-800">{r.TOTAL}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Por usuario */}
            <div className="px-6 pb-12">
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
                                {porUsuario.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-3 py-6 text-center text-slate-400">
                                            Sin datos
                                        </td>
                                    </tr>
                                ) : (
                                    porUsuario.map((r, i) => (
                                        <tr key={i} className="border-t border-slate-100 hover:bg-violet-50/60">
                                            <td className="px-3 py-2">{r.USUARIO}</td>
                                            <td className="px-3 py-2 font-semibold text-violet-700">
                                                {r.TOTAL}
                                            </td>
                                        </tr>
                                    ))
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
