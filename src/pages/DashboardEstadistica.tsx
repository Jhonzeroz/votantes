import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { Users, MapPin, FolderCheck, FolderClosed, ClipboardList, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface Registro {
    brigada: string;
    comunidad: string;
    total: number;
}

const DashboardEstadistica: React.FC = () => {
    const [asignadas, setAsignadas] = useState<Registro[]>([]);
    const [cerradas, setCerradas] = useState<Registro[]>([]);
    const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        const fetchDatos = async () => {
            try {
                fetch(`https://systemsticsas.com/app/apilectw/consultar_asignaciones.php?_t=${Date.now()}`)
                const res = await fetch(`https://systemsticsas.com/app/apilectw/estadisticas_por_brigada.php?_t=${Date.now()}`);
                const data = await res.json();
                if (data.success) {
                    setAsignadas(data.asignadas);
                    setCerradas(data.cerradas);
                } else {
                    toast.warning('⚠️ No se pudo obtener los datos por brigada');
                }
            } catch (error) {
                toast.error('❌ Error de red al consultar brigadas');
            }
        };

        fetchDatos();
    }, []);

    const agruparPorBrigada = (data: Registro[]) => {
        return data.reduce((acc, curr) => {
            if (!acc[curr.brigada]) acc[curr.brigada] = [];
            acc[curr.brigada].push(curr);
            return acc;
        }, {} as { [key: string]: Registro[] });
    };

    const exportarAExcel = (data: Registro[], nombreArchivo: string) => {
        const worksheet = XLSX.utils.json_to_sheet(
            data.map(item => ({
                Brigada: item.brigada || 'Sin brigada',
                Comunidad: item.comunidad,
                Total: item.total,
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Órdenes');
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        saveAs(blob, `${nombreArchivo}.xlsx`);
    };

    const asignadasAgrupadas = agruparPorBrigada(asignadas);
    const cerradasAgrupadas = agruparPorBrigada(cerradas);
    const totalAsignadas = asignadas.reduce((sum, r) => sum + r.total, 0);
    const totalCerradas = cerradas.reduce((sum, r) => sum + r.total, 0);

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <Navbar />
            <div className="p-6 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h1 className="text-2xl font-bold">Órdenes agrupadas por brigada</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={() => exportarAExcel(asignadas, 'ordenes_asignadas')}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm"
                        >
                            📥 Descargar Asignadas
                        </button>
                        <button
                            onClick={() => exportarAExcel(cerradas, 'ordenes_cerradas')}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
                        >
                            📥 Descargar Cerradas
                        </button>
                    </div>
                </div>

                {/* Cards resumen */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-800 border border-yellow-500/30 p-6 rounded-xl shadow flex items-center gap-4">
                        <div className="bg-yellow-500/10 p-4 rounded-full">
                            <ClipboardList className="text-yellow-400 w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Asignadas</p>
                            <h3 className="text-3xl font-bold text-white">{totalAsignadas}</h3>
                        </div>
                    </div>

                    <div className="bg-gray-800 border border-green-500/30 p-6 rounded-xl shadow flex items-center gap-4">
                        <div className="bg-green-500/10 p-4 rounded-full">
                            <CalendarDays className="text-green-400 w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Total Cerradas</p>
                            <h3 className="text-3xl font-bold text-white">{totalCerradas}</h3>
                        </div>
                    </div>
                </div>

                {/* Asignadas y Cerradas lado a lado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Asignadas */}
                    <section className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow w-full">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-yellow-400">
                            <FolderClosed className="w-5 h-5" />
                            Órdenes Asignadas
                        </h2>

                        {Object.entries(asignadasAgrupadas).map(([brigada, registros]) => (
                            <div key={brigada} className="mb-3">
                                <div
                                    className="cursor-pointer flex items-center justify-between bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
                                    onClick={() => setExpanded(prev => ({ ...prev, [brigada]: !prev[brigada] }))}
                                >
                                    <span className="font-medium flex items-center gap-2">
                                        <Users className="w-4 h-4 text-white" />
                                        {brigada || 'Sin brigada'}
                                    </span>
                                    <span className="text-lg">{expanded[brigada] ? '−' : '+'}</span>
                                </div>

                                {expanded[brigada] && (
                                    <div className="mt-2 bg-gray-900 rounded px-4 py-2 border border-gray-700">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-gray-400 border-b border-gray-700">
                                                    <th className="px-2 py-1 flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        Comunidad
                                                    </th>
                                                    <th className="px-2 py-1">Cantidad</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {registros.map((r, idx) => (
                                                    <tr key={idx} className="border-b border-gray-800">
                                                        <td className="px-2 py-1">{r.comunidad}</td>
                                                        <td className="px-2 py-1">{r.total}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </section>

                    {/* Cerradas */}
                    <section className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow w-full">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-green-400">
                            <FolderCheck className="w-5 h-5" />
                            Órdenes Cerradas
                        </h2>

                        {Object.entries(cerradasAgrupadas).map(([brigada, registros]) => (
                            <div key={brigada} className="mb-3">
                                <div
                                    className="cursor-pointer flex items-center justify-between bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
                                    onClick={() => setExpanded(prev => ({ ...prev, [brigada + '_cerradas']: !prev[brigada + '_cerradas'] }))}
                                >
                                    <span className="font-medium flex items-center gap-2">
                                        <Users className="w-4 h-4 text-white" />
                                        {brigada || 'Sin brigada'}
                                    </span>
                                    <span className="text-lg">{expanded[brigada + '_cerradas'] ? '−' : '+'}</span>
                                </div>

                                {expanded[brigada + '_cerradas'] && (
                                    <div className="mt-2 bg-gray-900 rounded px-4 py-2 border border-gray-700">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-gray-400 border-b border-gray-700">
                                                    <th className="px-2 py-1 flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        Comunidad
                                                    </th>
                                                    <th className="px-2 py-1">Cantidad</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {registros.map((r, idx) => (
                                                    <tr key={idx} className="border-b border-gray-800">
                                                        <td className="px-2 py-1">{r.comunidad}</td>
                                                        <td className="px-2 py-1">{r.total}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default DashboardEstadistica;
