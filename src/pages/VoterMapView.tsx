import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { UserX, Loader2, BarChart3, X, ChevronLeft } from "lucide-react";

// Le decimos a TypeScript que existe una variable global 'L' (de Leaflet)
declare var L: any;

// --- Definición de Tipos ---
interface ZoneData {
    id_zona: number;
    nombre_zona: string;
    id_lider: number | null;
    nombre_lider: string;
    total_votantes: number;
}

// --- IMPORTANTE: Coordenadas de las Zonas ---
// Debes rellenar este objeto con las coordenadas reales de tus zonas.
const zoneCoordinates: { [key: string]: [number, number] } = {
    "HIPODROMO": [10.9833, -74.7967],
    "OASIS": [10.9900, -74.8000],
    "BARRANQUILLA": [10.9833, -74.7967],
    "SOLEDAD": [10.9185, -74.7629],
    "MALAMBO": [10.8617, -74.7717],
    "GALAPA": [10.8928, -74.8989],
    // Añade aquí el resto de tus zonas con sus coordenadas
};

const VoterMapView: React.FC = () => {
    const [zoneData, setZoneData] = useState<ZoneData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeZoneId, setActiveZoneId] = useState<number | null>(null);
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any>({}); // Para guardar las referencias a los marcadores

    useEffect(() => {
        const loadLeafletScript = () => {
            return new Promise<void>((resolve, reject) => {
                if (window.L) {
                    resolve();
                    return;
                }
                const script = document.createElement('script');
                script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
                script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
                script.crossOrigin = '';
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load Leaflet script'));
                document.head.appendChild(script);
            });
        };

        const initializeMap = async () => {
            try {
                // 1. Cargar el script de Leaflet
                await loadLeafletScript();

                // 2. Cargar los datos de las zonas
                const response = await fetch("https://datainsightscloud.com/Apis/mapa_votantes_zona.php");
                const result = await response.json();
                if (!result?.success) {
                    throw new Error(result.message || "Error al cargar los datos del mapa");
                }
                setZoneData(result.data);

                // --- SOLUCIÓN CLAVE ---
                // 3. Añadimos un pequeño retraso para asegurar que el contenedor del mapa esté listo
                setTimeout(() => {
                    if (mapRef.current && window.L) {
                        const map = L.map(mapRef.current).setView([10.5, -74.8], 10);

                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        }).addTo(map);

                        // Forzar a Leaflet a recalcular su tamaño, crucial para la navegación
                        setTimeout(() => {
                            map.invalidateSize();
                        }, 200);

                        mapInstanceRef.current = map;

                        // Función para crear marcadores personalizados
                        const createCustomIcon = (zone: ZoneData) => {
                            const hasLeader = zone.id_lider !== null;
                            const iconColor = hasLeader ? 'bg-green-500' : 'bg-red-500';
                            return L.divIcon({
                                className: 'custom-marker',
                                html: `
                                    <div class="relative flex flex-col items-center">
                                        <div class="${iconColor} text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white">
                                            ${zone.total_votantes}
                                        </div>
                                        <div class="bg-white rounded-md px-2 py-1 shadow-md border border-gray-200 mt-1">
                                            <p class="text-xs font-semibold text-gray-700 whitespace-nowrap">${zone.nombre_zona}</p>
                                        </div>
                                    </div>
                                `,
                                iconSize: [80, 40],
                                iconAnchor: [40, 40],
                                popupAnchor: [0, -35],
                            });
                        };

                        // Añadir los marcadores
                        result.data.forEach((zone: ZoneData) => {
                            const position = zoneCoordinates[zone.nombre_zona];
                            if (!position) {
                                console.warn(`No se encontraron coordenadas para la zona: ${zone.nombre_zona}`);
                                return;
                            }

                            const popupContent = `
                                <div class="p-3 min-w-[220px] font-sans">
                                    <h3 class="font-bold text-lg text-gray-800 mb-3 border-b pb-2">${zone.nombre_zona}</h3>
                                    <div class="space-y-2 text-sm">
                                        <p class="flex items-center justify-between">
                                            <span class="font-medium text-gray-600">Líder:</span>
                                            <span class="${zone.id_lider ? 'text-green-600' : 'text-red-500'} font-semibold">
                                                ${zone.nombre_lider}
                                            </span>
                                        </p>
                                        <p class="flex items-center justify-between">
                                            <span class="font-medium text-gray-600">Votantes:</span>
                                            <span class="text-indigo-600 font-bold text-lg">${zone.total_votantes}</span>
                                        </p>
                                    </div>
                                </div>
                            `;

                            const marker = L.marker(position, { icon: createCustomIcon(zone) })
                                .addTo(map)
                                .bindPopup(popupContent);

                            markersRef.current[zone.id_zona] = marker;
                        });
                    }
                }, 150); // Un pequeño retraso de 150ms

            } catch (e: any) {
                setError(e.message);
                toast.error(e.message);
            } finally {
                setLoading(false);
            }
        };

        initializeMap();

        // Función de limpieza para cuando el componente se desmonte
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
            }
        };
    }, []); // El array vacío asegura que se ejecute solo una vez

    // ... (El resto del código del componente se mantiene igual)
    const focusOnZone = (zone: ZoneData) => {
        const position = zoneCoordinates[zone.nombre_zona];
        if (!position || !mapInstanceRef.current) return;

        mapInstanceRef.current.setView(position, 13, { animate: true });
        setActiveZoneId(zone.id_zona);

        const marker = markersRef.current[zone.id_zona];
        if (marker) {
            marker.openPopup();
        }
    };

    const totalVoters = zoneData.reduce((sum, zone) => sum + zone.total_votantes, 0);
    const zonesWithLeader = zoneData.filter(z => z.id_lider).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-red-600">
                <p className="text-xl font-semibold">Error al cargar el mapa</p>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="h-screen w-full flex">
            <div className={`bg-white shadow-xl transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-80' : 'w-0'} overflow-hidden`}>
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <BarChart3 className="w-6 h-6 mr-2 text-indigo-600" />
                            Panel de Zonas
                        </h2>
                        <button onClick={() => setIsSidebarOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                            <p className="text-indigo-600 text-xs font-medium">Total Zonas</p>
                            <p className="text-2xl font-bold text-indigo-800">{zoneData.length}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <p className="text-green-600 text-xs font-medium">Con Líder</p>
                            <p className="text-2xl font-bold text-green-800">{zonesWithLeader}</p>
                        </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-gray-600 text-xs font-medium">Total Votantes</p>
                        <p className="text-2xl font-bold text-gray-800">{totalVoters}</p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Lista de Zonas</h3>
                        <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                            {zoneData.map((zone) => (
                                <div
                                    key={zone.id_zona}
                                    onClick={() => focusOnZone(zone)}
                                    className={`p-2 rounded-lg cursor-pointer transition-colors duration-200 flex items-center justify-between ${activeZoneId === zone.id_zona ? 'bg-indigo-100 border border-indigo-300' : 'hover:bg-gray-100'}`}
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{zone.nombre_zona}</p>
                                        <p className="text-xs text-gray-500">{zone.total_votantes} votantes</p>
                                    </div>
                                    {zone.id_lider ? (
                                        <span title="Con líder">
                                            <UserX className="w-4 h-4 text-green-500" />
                                        </span>
                                    ) : (
                                        <span title="Sin líder">
                                            <UserX className="w-4 h-4 text-red-500" />
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 relative">
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md z-10 p-4">
                    {!isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="absolute top-4 left-4 z-10 bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-700" />
                        </button>
                    )}
                    <h1 className="text-2xl font-bold text-white">Mapa de Votantes por Zona</h1>
                    <p className="text-sm text-blue-100">Explora las zonas y haz clic en los marcadores para ver los detalles.</p>
                </div>
                <div ref={mapRef} className="w-full h-full" style={{ marginTop: '80px' }} />
            </div>
        </div>
    );
};

export default VoterMapView;