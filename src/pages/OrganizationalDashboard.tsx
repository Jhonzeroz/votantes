import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Building, MapPin, Map, UserCheck, AlertCircle, Activity, ChevronDown, ChevronUp, UserX, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom"; // Asumiendo que usas React Router

// --- Interfaces (sin cambios) ---
interface SummaryStats {
    total_dptos: number;
    total_mncpios: number;
    total_zonas: number;
    dptos_con_lider: number;
    mncpios_con_lider: number;
    zonas_con_lider: number;
    dptos_sin_lider: number;
    mncpios_sin_lider: number;
    zonas_sin_lider: number;
}

interface DetailItem {
    ID_DPTO?: number;
    ID_MUNICIPIO?: number;
    ID_ZONA?: number;
    NOMBRE_DPTO?: string;
    NOMBRE_MUNICIPIO?: string;
    NOMBRE_ZONA?: string;
    NOMBRE_LIDER: string;
}

interface DashboardData {
    summary: SummaryStats;
    details: {
        departamentos: DetailItem[];
        municipios: DetailItem[];
        zonas: DetailItem[];
    };
}

          const handleRedirectToUsuarios = () => {
        window.location.href = "/dashboard";
    };

// --- Componente para Tarjetas KPI ---
const KpiCard: React.FC<{ title: string; current: number; total: number; icon: React.ElementType; color: string }> = ({ title, current, total, icon: Icon, color }) => {
    const percentage = total > 0 ? (current / total) * 100 : 0;
    const isNegative = title.toLowerCase().includes('sin');
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-semibold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                    {percentage.toFixed(0)}%
                </span>
            </div>
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">
                {current} <span className="text-lg font-normal text-gray-500">de {total}</span>
            </p>
        </div>
    );
};

// --- Componente para Secciones Colapsables ---
const CollapsibleSection: React.FC<{ title: string; icon: React.ElementType; iconColor: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon: Icon, iconColor, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
                <h2 className={`text-xl font-semibold text-gray-800 flex items-center`}>
                    <Icon className={`w-6 h-6 mr-2 ${iconColor}`} />
                    {title}
                </h2>
                {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
            </button>
            {isOpen && <div className="px-6 pb-6">{children}</div>}
        </div>
    );
};


const OrganizationalDashboard: React.FC = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await fetch("https://devsoul.co/api_votantes/dashboard_stats.php");
                const result = await response.json();
                if (result?.success) {
                    setData(result.data);
                } else {
                    toast.error("Error al cargar los datos del dashboard");
                }
            } catch (error) {
                toast.error("Error de conexión al cargar el dashboard");
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
            </div>
        );
    }

    if (!data) {
        return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-gray-600">No se pudieron cargar los datos.</div>;
    }

    // --- Lógica para Insights Clave ---
    const insights = [
        { level: 'Departamentos', sin_lider: data.summary.dptos_sin_lider, total: data.summary.total_dptos },
        { level: 'Municipios', sin_lider: data.summary.mncpios_sin_lider, total: data.summary.total_mncpios },
        { level: 'Zonas', sin_lider: data.summary.zonas_sin_lider, total: data.summary.total_zonas },
    ].sort((a, b) => (b.sin_lider / b.total) - (a.sin_lider / a.total));

    const criticalInsight = insights[0];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center mb-8">

                     <button
                                                                onClick={handleRedirectToUsuarios}
                                                                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                                            >
                                                                <ArrowLeft className="w-5 h-5 mr-2" />
                                                                Regresar
                                                            </button>


                    <Activity className="w-8 h-8 text-indigo-600 mr-3" />
                    <h1 className="text-4xl font-bold text-gray-800">Panel de Control </h1>

                      
                </div>

                {/* Insights Clave */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-xl shadow-lg text-white mb-8">

                    <p className="text-xl">
                        {criticalInsight.sin_lider > 0
                            ? `El nivel que más atención necesita es <strong>${criticalInsight.level}</strong>, con <strong>${criticalInsight.sin_lider} de ${criticalInsight.total}</strong> puestos sin líder asignado.`
                            : '¡Excelente trabajo! Todas las entidades tienen un líder asignado.'}
                    </p>
                </div>

                {/* Sección de Tarjetas de Resumen (KPIs) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <KpiCard title="Departamentos sin Líder" current={data.summary.dptos_sin_lider} total={data.summary.total_dptos} icon={AlertCircle} color="bg-red-500" />
                    <KpiCard title="Municipios sin Líder" current={data.summary.mncpios_sin_lider} total={data.summary.total_mncpios} icon={AlertCircle} color="bg-orange-500" />
                    <KpiCard title="Zonas sin Líder" current={data.summary.zonas_sin_lider} total={data.summary.total_zonas} icon={AlertCircle} color="bg-pink-500" />
                    <KpiCard title="Departamentos con Líder" current={data.summary.dptos_con_lider} total={data.summary.total_dptos} icon={UserCheck} color="bg-green-500" />
                    <KpiCard title="Municipios con Líder" current={data.summary.mncpios_con_lider} total={data.summary.total_mncpios} icon={UserCheck} color="bg-teal-500" />
                    <KpiCard title="Zonas con Líder" current={data.summary.zonas_con_lider} total={data.summary.total_zonas} icon={UserCheck} color="bg-blue-500" />
                </div>

           {/* Sección de Tablas Detalladas en Acordeón y 2 Columnas */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <CollapsibleSection title="Estructura de Departamentos" icon={Building} iconColor="text-blue-600">
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Departamento</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Líder</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.details.departamentos.map(dpto => (
                        <tr key={dpto.ID_DPTO} className="hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-900">
                                {/* Ejemplo de cómo hacer el nombre un enlace a la página de edición */}
                                <Link to={`/departamentos/edit/${dpto.ID_DPTO}`} className="text-blue-600 hover:underline">
                                    {dpto.NOMBRE_DPTO}
                                </Link>
                            </td>
                            <td className="py-3 px-4">
                                {dpto.NOMBRE_LIDER === "Sin asignar" ? (
                                    <span className="flex items-center text-red-500">
                                        <UserX className="w-4 h-4 mr-2" /> {dpto.NOMBRE_LIDER}
                                    </span>
                                ) : (
                                    <span className="flex items-center text-green-600">
                                        <UserCheck className="w-4 h-4 mr-2" />{dpto.NOMBRE_LIDER}
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </CollapsibleSection>

    <CollapsibleSection title="Estructura de Municipios" icon={MapPin} iconColor="text-green-600">
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Municipio</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Líder</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.details.municipios.map(mncpio => (
                        <tr key={mncpio.ID_MUNICIPIO} className="hover:bg-gray-50">
                            <td className="py-3 px-4">
                                <div>
                                    <Link to={`/municipios/edit/${mncpio.ID_MUNICIPIO}`} className="font-medium text-blue-600 hover:underline">
                                        {mncpio.NOMBRE_MUNICIPIO}
                                    </Link>
                                    <p className="text-xs text-gray-500">{mncpio.NOMBRE_DPTO}</p>
                                </div>
                            </td>
                            <td className="py-3 px-4">
                                {mncpio.NOMBRE_LIDER === "Sin asignar" ? (
                                    <span className="flex items-center text-red-500">
                                        <UserX className="w-4 h-4 mr-2" /> {mncpio.NOMBRE_LIDER}
                                    </span>
                                ) : (
                                    <span className="flex items-center text-green-600">
                                        <UserCheck className="w-4 h-4 mr-2" />{mncpio.NOMBRE_LIDER}
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </CollapsibleSection>

    <CollapsibleSection title="Estructura de Zonas" icon={Map} iconColor="text-purple-600">
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Zona</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Municipio</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Líder</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.details.zonas.map(zona => (
                        <tr key={zona.ID_ZONA} className="hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-900">
                                <Link to={`/zonas/edit/${zona.ID_ZONA}`} className="text-blue-600 hover:underline">
                                    {zona.NOMBRE_ZONA}
                                </Link>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{zona.NOMBRE_MUNICIPIO}</td>
                            <td className="py-3 px-4">
                                {zona.NOMBRE_LIDER === "Sin asignar" ? (
                                    <span className="flex items-center text-red-500">
                                        <UserX className="w-4 h-4 mr-2" /> {zona.NOMBRE_LIDER}
                                    </span>
                                ) : (
                                    <span className="flex items-center text-green-600">
                                        <UserCheck className="w-4 h-4 mr-2" />{zona.NOMBRE_LIDER}
                                    </span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </CollapsibleSection>
</div>
            </div>
        </div>
    );
};

export default OrganizationalDashboard;