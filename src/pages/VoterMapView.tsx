import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {  Loader2, BarChart3, X, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

// Leaflet global
declare global {
  interface Window { L: any; }
}
declare var L: any;

// --- Tipos ---
interface MpioData {
  MUNICIPIO: string;
  DEPARTAMENTO: string;
  TOTAL: number;
}

// --- Coordenadas por MUNICIPIO ---
// NOTA: Debes poblar este objeto con las coordenadas de todos tus municipios.
// Puedes usar herramientas como Google Maps para buscarlas.
const municipalityCoordinates: { [key: string]: [number, number] } = {
  "BARRANQUILLA": [10.9639, -74.7963],
  "PIVIJAY": [10.4833, -74.6333],
  "BARANOA": [10.7967, -74.9167],
  // Añade aquí todos los demás municipios...
  // "NOMBRE_MUNICIPIO": [latitud, longitud],
};


// --- Helpers ---
const normalize = (s: string) =>
  s.normalize("NFD")
   .replace(/[\u0300-\u036f]/g, "")
   .replace(/’/g, "'")
   .trim()
   .toUpperCase();

const VoterMapByDepartment: React.FC = () => {
  const [municipalityData, setMunicipalityData] = useState<MpioData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeMunicipioKey, setActiveMunicipioKey] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({}); // por nombre normalizado

  // Carga CSS/JS de Leaflet
  const loadLeafletAssets = () => {
    const ensureCss = () =>
      new Promise<void>((resolve, reject) => {
        const id = "leaflet-css";
        if (document.getElementById(id)) return resolve();
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        link.crossOrigin = "";
        link.onload = () => resolve();
        link.onerror = () => reject(new Error("Failed to load Leaflet CSS"));
        document.head.appendChild(link);
      });

    const ensureJs = () =>
      new Promise<void>((resolve, reject) => {
        if (window.L) return resolve();
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
        script.crossOrigin = "";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Leaflet script"));
        document.head.appendChild(script);
      });

    return Promise.all([ensureCss(), ensureJs()]);
  };

  useEffect(() => {
    const initializeMap = async () => {
      try {
        await loadLeafletAssets();

        // ✅ Usa el API de MUNICIPIOS
        const response = await fetch(
          "https://datainsightscloud.com/Apis/votantes_por_municipio.php?_t=" + Date.now()
        );
        const result = await response.json();
        if (!result?.success) throw new Error(result.message || "Error al cargar datos del mapa");

        const incoming: MpioData[] = result.data || [];
        setMunicipalityData(incoming);

        setTimeout(() => {
          if (mapRef.current && window.L) {
            const map = L.map(mapRef.current).setView([9.5, -74.8], 6);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);
            setTimeout(() => map.invalidateSize(), 200);
            mapInstanceRef.current = map;

            // Icono personalizado para municipios
            const createCustomIcon = (mpio: MpioData) => {
              return L.divIcon({
                className: "custom-marker",
                html: `
                  <div class="relative flex flex-col items-center">
                    <div class="bg-blue-500 text-white text-xs font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-white">
                      ${mpio.TOTAL}
                    </div>
                    <div class="bg-white rounded-md px-2 py-1 shadow-md border border-gray-200 mt-1">
                      <p class="text-xs font-semibold text-gray-700 whitespace-nowrap">${mpio.MUNICIPIO}</p>
                    </div>
                  </div>
                `,
                iconSize: [90, 48],
                iconAnchor: [45, 45],
                popupAnchor: [0, -38],
              });
            };

            // Marcadores (solo > 0) y por clave normalizada
            incoming
              .filter((d) => d.TOTAL > 0)
              .forEach((mpio) => {
                const key = normalize(mpio.MUNICIPIO);
                const position = municipalityCoordinates[key];
                if (!position) {
                  console.warn(`Sin coordenadas para: ${mpio.MUNICIPIO} (${key})`);
                  return;
                }

                const popupContent = `
                  <div class="p-3 min-w-[240px] font-sans">
                    <h3 class="font-bold text-lg text-gray-800 mb-3 border-b pb-2">${mpio.MUNICIPIO}</h3>
                    <div class="space-y-2 text-sm">
                      <p class="flex items-center justify-between">
                        <span class="font-medium text-gray-600">Departamento:</span>
                        <span class="text-gray-800 font-semibold">${mpio.DEPARTAMENTO}</span>
                      </p>
                      <p class="flex items-center justify-between">
                        <span class="font-medium text-gray-600">Votantes:</span>
                        <span class="text-indigo-600 font-bold text-lg">${mpio.TOTAL}</span>
                      </p>
                    </div>
                  </div>
                `;

                const marker = L.marker(position, { icon: createCustomIcon(mpio) })
                  .addTo(map)
                  .bindPopup(popupContent);

                markersRef.current[key] = marker;
              });
          }
        }, 150);
      } catch (e: any) {
        setError(e.message);
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (mapInstanceRef.current) mapInstanceRef.current.remove();
    };
  }, []);

  // Foco por municipio
  const focusOnMunicipality = (mpio: MpioData) => {
    const key = normalize(mpio.MUNICIPIO);
    const position = municipalityCoordinates[key];
    if (!position || !mapInstanceRef.current) return;

    mapInstanceRef.current.setView(position, 9, { animate: true }); // Zoom más alto para municipios
    setActiveMunicipioKey(key);

    const marker = markersRef.current[key];
    if (marker) marker.openPopup();
  };

  // KPIs (calculados desde los datos de municipios)
  const listData = municipalityData.filter((d) => d.TOTAL > 0);
  const totalVoters = listData.reduce((sum, d) => sum + d.TOTAL, 0);
  const totalMpios = listData.length;

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
      {/* Sidebar */}
      <div className={`bg-white shadow-xl transition-all duration-300 ease-in-out ${isSidebarOpen ? "w-80" : "w-0"} overflow-hidden`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2 text-indigo-600" />
              Panel de Municipios
            </h2>
            <div className="flex items-center gap-2">
              <Link to="/dashboard" className="p-2 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all" title="Volver al Dashboard">
                <ChevronLeft className="w-5 h-5 text-blue-600" />
              </Link>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100" title="Cerrar panel">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
              <p className="text-indigo-600 text-xs font-medium">Total Mpios</p>
              <p className="text-2xl font-bold text-indigo-800">{totalMpios}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-gray-600 text-xs font-medium">Total Votantes</p>
              <p className="text-2xl font-bold text-gray-800">{totalVoters}</p>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Lista de Municipios</h3>
            <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
              {listData.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No hay municipios con votantes registrados.</p>
              ) : (
                listData.map((mpio) => {
                  const key = normalize(mpio.MUNICIPIO);
                  return (
                    <div
                      key={key}
                      onClick={() => focusOnMunicipality(mpio)}
                      className={`p-2 rounded-lg cursor-pointer transition-colors duration-200 flex items-center justify-between ${
                        activeMunicipioKey === key ? "bg-indigo-100 border border-indigo-300" : "hover:bg-gray-100"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">{mpio.MUNICIPIO}</p>
                        <p className="text-xs text-gray-500">{mpio.DEPARTAMENTO}</p>
                      </div>
                      <span className="text-indigo-600 font-bold text-sm">{mpio.TOTAL}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="flex-1 relative">
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md z-10 p-4">
          {!isSidebarOpen && (
            <button onClick={() => setIsSidebarOpen(true)} className="absolute top-4 left-4 z-10 bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow">
              <ChevronLeft className="w-6 h-6 text-gray-700" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-white">Mapa de Votantes por Municipio</h1>
          <p className="text-sm text-blue-100">Explora los municipios y haz clic en los marcadores para ver detalles.</p>
        </div>
        <div ref={mapRef} className="w-full h-full" style={{ marginTop: "80px" }} />
      </div>
    </div>
  );
};

export default VoterMapByDepartment;