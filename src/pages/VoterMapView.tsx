import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { UserX, Loader2, BarChart3, X, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";


// Leaflet global
declare global {
  interface Window { L: any; }
}
declare var L: any;

// --- Tipos ---
interface DeptData {
  id_dpto: number;
  nombre_dpto: string;
  id_lider: number | null;
  nombre_lider: string;
  total_votantes: number;
}

type AggDept = {
  key: string;                 // nombre normalizado (clave)
  nombre: string;              // nombre a mostrar (primer casing visto)
  total_votantes: number;      // suma total
  id_lider: number | null;     // líder escogido (prefiere el que tenga votos)
  nombre_lider: string;        // idem
  ids: number[];               // ids originales agrupados (debug/uso futuro)
};

// --- Coordenadas por DEPARTAMENTO ---
const departmentCoordinates: { [key: string]: [number, number] } = {
  "ANTIOQUIA": [6.5546, -75.5742],
  "ATLANTICO": [10.9639, -74.7963],
  "BOLIVAR": [10.4236, -75.5253],
  "MAGDALENA": [11.2408, -74.1990],
};



// --- Helpers ---
const normalize = (s: string) =>
  s.normalize("NFD")
   .replace(/[\u0300-\u036f]/g, "")
   .replace(/’/g, "'")
   .trim()
   .toUpperCase();

function aggregateByDeptName(data: DeptData[]): AggDept[] {
  const map = new Map<string, AggDept>();

  for (const d of data) {
    const key = normalize(d.nombre_dpto || "");
    const curr = map.get(key);

    if (!curr) {
      map.set(key, {
        key,
        nombre: d.nombre_dpto,
        total_votantes: d.total_votantes || 0,
        id_lider: d.total_votantes > 0 ? d.id_lider : null,
        nombre_lider: d.total_votantes > 0 ? d.nombre_lider : (d.id_lider ? d.nombre_lider : "Sin líder asignado"),
        ids: [d.id_dpto],
      });
    } else {
      // sumar votantes
      curr.total_votantes += (d.total_votantes || 0);

      // si este registro tiene votos y líder, priorízalo
      if ((d.total_votantes || 0) > 0 && d.id_lider !== null) {
        curr.id_lider = d.id_lider;
        curr.nombre_lider = d.nombre_lider;
      } else if (curr.id_lider === null && d.id_lider !== null) {
        // si no hay líder aún, toma cualquiera disponible
        curr.id_lider = d.id_lider;
        curr.nombre_lider = d.nombre_lider;
      }

      curr.ids.push(d.id_dpto);
    }
  }

  return Array.from(map.values());
}

const VoterMapByDepartment: React.FC = () => {
  const [rawData, setRawData] = useState<DeptData[]>([]);
  const [aggData, setAggData] = useState<AggDept[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeDeptKey, setActiveDeptKey] = useState<string | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({}); // por nombre normalizado



  useEffect(() => {
  console.log("rawData:", rawData);
}, [rawData]);


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

        // ✅ Usa el API por DEPARTAMENTO
        const response = await fetch(
          "https://datainsightscloud.com/Apis/mapa_votantes_zona.php?_t=" + Date.now()
        );
        const result = await response.json();
        if (!result?.success) throw new Error(result.message || "Error al cargar datos del mapa");

        const incoming: DeptData[] = result.data || [];
        setRawData(incoming);

        // Agrupa por nombre y filtra para mapa/lista (solo > 0)
        const grouped = aggregateByDeptName(incoming);
        setAggData(grouped);

        setTimeout(() => {
          if (mapRef.current && window.L) {
            const map = L.map(mapRef.current).setView([9.5, -74.8], 6);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            }).addTo(map);
            setTimeout(() => map.invalidateSize(), 200);
            mapInstanceRef.current = map;

            // Icono
            const createCustomIcon = (dept: AggDept) => {
              const hasLeader = dept.id_lider !== null;
              const iconColor = hasLeader ? "bg-green-500" : "bg-red-500";
              return L.divIcon({
                className: "custom-marker",
                html: `
                  <div class="relative flex flex-col items-center">
                    <div class="${iconColor} text-white text-xs font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-lg border-2 border-white">
                      ${dept.total_votantes}
                    </div>
                    <div class="bg-white rounded-md px-2 py-1 shadow-md border border-gray-200 mt-1">
                      <p class="text-xs font-semibold text-gray-700 whitespace-nowrap">${dept.nombre}</p>
                    </div>
                  </div>
                `,
                iconSize: [90, 48],
                iconAnchor: [45, 45],
                popupAnchor: [0, -38],
              });
            };

            // Marcadores (solo > 0) y por clave normalizada
            grouped
              .filter((d) => d.total_votantes > 0)
              .forEach((dept) => {
                const position = departmentCoordinates[dept.key];
                if (!position) {
                  console.warn(`Sin coordenadas para: ${dept.nombre} (${dept.key})`);
                  return;
                }

                const popupContent = `
                  <div class="p-3 min-w-[240px] font-sans">
                    <h3 class="font-bold text-lg text-gray-800 mb-3 border-b pb-2">${dept.nombre}</h3>
                    <div class="space-y-2 text-sm">
                      <p class="flex items-center justify-between">
                        <span class="font-medium text-gray-600">Líder:</span>
                        <span class="${dept.id_lider ? "text-green-600" : "text-red-500"} font-semibold">
                          ${dept.nombre_lider || "Sin líder asignado"}
                        </span>
                      </p>
                      <p class="flex items-center justify-between">
                        <span class="font-medium text-gray-600">Votantes:</span>
                        <span class="text-indigo-600 font-bold text-lg">${dept.total_votantes}</span>
                      </p>
                    </div>
                  </div>
                `;

                const marker = L.marker(position, { icon: createCustomIcon(dept) })
                  .addTo(map)
                  .bindPopup(popupContent);

                markersRef.current[dept.key] = marker;
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

  // Foco por departamento agrupado
  const focusOnDepartment = (dept: AggDept) => {
    const position = departmentCoordinates[dept.key];
    if (!position || !mapInstanceRef.current) return;

    mapInstanceRef.current.setView(position, 7, { animate: true });
    setActiveDeptKey(dept.key);

    const marker = markersRef.current[dept.key];
    if (marker) marker.openPopup();
  };

  // KPIs (sobre agrupación)
  const listData = aggData.filter((d) => d.total_votantes > 0); // lo que se muestra
  const totalVoters = listData.reduce((sum, d) => sum + d.total_votantes, 0);
  const totalDptos = listData.length;
  const deptsWithLeader = listData.filter((d) => d.id_lider).length;

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
      Panel de Departamentos
    </h2>

    <div className="flex items-center gap-2">
      {/* Botón para volver al Dashboard */}
      <Link
        to="/dashboard"
        className="p-2 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all"
        title="Volver al Dashboard"
      >
        <ChevronLeft className="w-5 h-5 text-blue-600" />
      </Link>

      {/* Botón para cerrar panel */}
      <button
        onClick={() => setIsSidebarOpen(false)}
        className="p-2 rounded-lg hover:bg-gray-100"
        title="Cerrar panel"
      >
        <X className="w-5 h-5 text-gray-600" />
      </button>
    </div>
  </div>
</div>


        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
              <p className="text-indigo-600 text-xs font-medium">Total Dptos</p>
              <p className="text-2xl font-bold text-indigo-800">{totalDptos}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="text-green-600 text-xs font-medium">Con Líder</p>
              <p className="text-2xl font-bold text-green-800">{deptsWithLeader}</p>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-xs font-medium">Total Votantes</p>
            <p className="text-2xl font-bold text-gray-800">{totalVoters}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Lista de Departamentos</h3>
            <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
              {listData.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">
                  No hay departamentos con votantes registrados.
                </p>
              ) : (
                listData.map((dept) => (
                  <div
                    key={dept.key}
                    onClick={() => focusOnDepartment(dept)}
                    className={`p-2 rounded-lg cursor-pointer transition-colors duration-200 flex items-center justify-between ${
                      activeDeptKey === dept.key ? "bg-indigo-100 border border-indigo-300" : "hover:bg-gray-100"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">{dept.nombre}</p>
                      <p className="text-xs text-gray-500">{dept.total_votantes} votantes</p>
                    </div>
                    {dept.id_lider ? (
                      <span title="Con líder">
                        <UserX className="w-4 h-4 text-green-500 rotate-45" />
                      </span>
                    ) : (
                      <span title="Sin líder">
                        <UserX className="w-4 h-4 text-red-500" />
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mapa */}
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
          <h1 className="text-2xl font-bold text-white">Mapa de Votantes por Departamento</h1>
          <p className="text-sm text-blue-100">Explora los departamentos y haz clic en los marcadores para ver detalles.</p>
        </div>
        <div ref={mapRef} className="w-full h-full" style={{ marginTop: "80px" }} />
      </div>
    </div>
  );
};

export default VoterMapByDepartment;
