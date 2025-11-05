import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, User, MapPin, Check, Edit2, Search, X, Map, ArrowLeft } from "lucide-react";

interface Zona {
  ID_ZONA: number;
  NOMBRE_ZONA: string;
  MUNICIPIO_ASIGNADO: number;
  LIDER_ZONA: number | null;
  NOMBRE_MUNICIPIO: string;
  NOMBRE_LIDER: string;
}

interface Municipio {
  ID_MUNICIPIO: number;
  NOMBRE_MUNICIPIO: string;
}

interface Usuario {
  ID_USUARIO: number;
  NOMBRE_USUARIO: string;
  APELLIDO_USUARIO: string;
  NIVEL_LIDERAZGO: 'DEPARTAMENTO' | 'MUNICIPIO' | 'ZONA' | null;
}

interface FormState {
  nombre_zona: string;
  municipio_asignado: string;
  lider_zona: string;
}

const ZoneManagement: React.FC = () => {
  const [form, setForm] = useState<FormState>({
    nombre_zona: "",
    municipio_asignado: "",
    lider_zona: ""
  });

  const [zonas, setZonas] = useState<Zona[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingZonas, setLoadingZonas] = useState(true);
  const [loadingMunicipios, setLoadingMunicipios] = useState(true);
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [saved, setSaved] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // NUEVO: zona en espera de aplicar edición cuando combos estén listos
  const [pendingZona, setPendingZona] = useState<Zona | null>(null);

  const handleRedirectToUsuarios = () => {
    window.location.href = "/dashboard";
  };

  // --- Cargas iniciales ---

  // Usuarios (SOLO UNA VEZ)
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const response = await fetch("https://devsoul.co/api_votantes/usuarios_disponibles.php");
        const json = await response.json();
        if (json?.success && Array.isArray(json.data)) {
          setUsuarios(json.data);
        } else {
          toast.error("Error al cargar la lista de usuarios para líderes");
        }
      } catch (error) {
        toast.error("Error de conexión al cargar usuarios");
        console.error("Error fetching usuarios:", error);
      } finally {
        setLoadingUsuarios(false);
      }
    };
    fetchUsuarios();
  }, []);

  // Zonas
  useEffect(() => {
    const fetchZonas = async () => {
      try {
        const response = await fetch("https://devsoul.co/api_votantes/zona_list.php");
        const json = await response.json();
        if (json?.success && Array.isArray(json.data)) {
          const parsed: Zona[] = json.data.map((z: any) => ({
            ID_ZONA: Number(z.ID_ZONA ?? z.id ?? 0),
            NOMBRE_ZONA: String(z.NOMBRE_ZONA ?? z.nombre ?? ''),
            MUNICIPIO_ASIGNADO: Number(z.MUNICIPIO_ASIGNADO ?? 0),
            LIDER_ZONA: z.LIDER_ZONA != null ? Number(z.LIDER_ZONA) : null,
            NOMBRE_MUNICIPIO: String(z.NOMBRE_MUNICIPIO ?? ''),
            NOMBRE_LIDER: String(z.NOMBRE_LIDER ?? ''),
          }));
          setZonas(parsed);
        } else {
          toast.error("Error al cargar las zonas");
        }
      } catch (error) {
        toast.error("Error de conexión al cargar zonas");
        console.error("Error fetching zonas:", error);
      } finally {
        setLoadingZonas(false);
      }
    };
    fetchZonas();
  }, []);

  // Municipios
  useEffect(() => {
    const fetchMunicipios = async () => {
      try {
        const response = await fetch("https://devsoul.co/api_votantes/mncpio_options.php");
        const json = await response.json();
        if (json?.success && Array.isArray(json.data)) {
          const parsed: Municipio[] = json.data.map((m: any) => ({
            ID_MUNICIPIO: Number(m.ID_MUNICIPIO ?? m.id ?? 0),
            NOMBRE_MUNICIPIO: String(m.NOMBRE_MUNICIPIO ?? m.nombre ?? ''),
          }));
          setMunicipios(parsed);
        } else {
          toast.error("Error al cargar los municipios");
        }
      } catch (error) {
        toast.error("Error de conexión al cargar municipios");
        console.error("Error fetching municipios:", error);
      } finally {
        setLoadingMunicipios(false);
      }
    };
    fetchMunicipios();
  }, []);

  // --- Handlers ---

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (zona: Zona) => {
    // No apliques inmediatamente; espera a que combos carguen
    setPendingZona(zona);
    setEditingId(zona.ID_ZONA);
  };

  const resetForm = () => {
    setForm({ nombre_zona: "", municipio_asignado: "", lider_zona: "" });
    setEditingId(null);
    setPendingZona(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.nombre_zona || !form.municipio_asignado) {
      return toast.error("El nombre y el municipio son obligatorios");
    }
    setLoading(true);
    try {
      const url = editingId
        ? `https://devsoul.co/api_votantes/zona_update.php?id=${editingId}`
        : "https://devsoul.co/api_votantes/zona_create.php";
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(editingId ? "Zona actualizada" : "Zona guardada");
        setSaved(true); setTimeout(() => setSaved(false), 3000);
        resetForm();

        // recarga zonas
        const r = await fetch("https://devsoul.co/api_votantes/zona_list.php");
        const j = await r.json();
        if (j?.success && Array.isArray(j.data)) {
          const parsed: Zona[] = j.data.map((z: any) => ({
            ID_ZONA: Number(z.ID_ZONA ?? z.id ?? 0),
            NOMBRE_ZONA: String(z.NOMBRE_ZONA ?? z.nombre ?? ''),
            MUNICIPIO_ASIGNADO: Number(z.MUNICIPIO_ASIGNADO ?? 0),
            LIDER_ZONA: z.LIDER_ZONA != null ? Number(z.LIDER_ZONA) : null,
            NOMBRE_MUNICIPIO: String(z.NOMBRE_MUNICIPIO ?? ''),
            NOMBRE_LIDER: String(z.NOMBRE_LIDER ?? ''),
          }));
          setZonas(parsed);
        }
      } else {
        toast.error(data.message || "Error al guardar la zona");
      }
    } catch (error) {
      toast.error("Error de conexión");
      console.error("Error saving zone:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- APLICAR EDICIÓN CUANDO COMBOS ESTÉN LISTOS (MEJORADO PARA LÍDER) ---

  useEffect(() => {
    if (!pendingZona) return;
    if (loadingMunicipios || loadingUsuarios) return;

    // 1) Resolver el ID del municipio (MANEJA EL CASO DE ID = 0)
    let municipioIdToSet = "";
    if (pendingZona.MUNICIPIO_ASIGNADO && pendingZona.MUNICIPIO_ASIGNADO > 0) {
      municipioIdToSet = String(pendingZona.MUNICIPIO_ASIGNADO);
    } else {
      const municipioEncontrado = municipios.find(
        m => m.NOMBRE_MUNICIPIO.toLowerCase() === pendingZona.NOMBRE_MUNICIPIO.toLowerCase()
      );
      if (municipioEncontrado) {
        municipioIdToSet = String(municipioEncontrado.ID_MUNICIPIO);
      }
    }

    // 2) Resolver el ID del líder (MEJORADO: BUSCA POR NOMBRE SI EL ID ES NULL)
    let liderIdToSet = "";
    if (pendingZona.LIDER_ZONA != null) {
      // Caso ideal: tenemos el ID del líder
      liderIdToSet = String(pendingZona.LIDER_ZONA);
    } else if (pendingZona.NOMBRE_LIDER) {
      // Caso problemático: no hay ID, pero hay un nombre.
      // Intentar encontrar al usuario por su nombre completo.
      const nombreLiderCompleto = pendingZona.NOMBRE_LIDER.trim().toLowerCase();
      const liderEncontrado = usuarios.find(u => {
        const nombreUsuarioCompleto = `${u.NOMBRE_USUARIO} ${u.APELLIDO_USUARIO}`.trim().toLowerCase();
        return nombreUsuarioCompleto === nombreLiderCompleto;
      });

      if (liderEncontrado) {
        liderIdToSet = String(liderEncontrado.ID_USUARIO);
        console.log(`Líder "${pendingZona.NOMBRE_LIDER}" encontrado por nombre con ID: ${liderIdToSet}`);
      } else {
        console.log(`Líder "${pendingZona.NOMBRE_LIDER}" no encontrado en la lista de usuarios disponibles.`);
      }
    }

    // 3) Setear el formulario con los valores resueltos
    setForm({
      nombre_zona: pendingZona.NOMBRE_ZONA ?? "",
      municipio_asignado: municipioIdToSet,
      lider_zona: liderIdToSet
    });

    // 4) Asegurar que el municipio exista en el select
    if (municipioIdToSet && !municipios.some(m => m.ID_MUNICIPIO === Number(municipioIdToSet))) {
      setMunicipios(prev => [
        ...prev,
        {
          ID_MUNICIPIO: Number(municipioIdToSet),
          NOMBRE_MUNICIPIO: pendingZona.NOMBRE_MUNICIPIO || "Municipio Desconocido"
        }
      ]);
    }

    // 5) Asegurar que el líder exista en el select
    if (liderIdToSet && !usuarios.some(u => u.ID_USUARIO === Number(liderIdToSet))) {
      const parts = (pendingZona.NOMBRE_LIDER || "").trim().split(/\s+/);
      const nombre = parts[0] || "Líder";
      const apellido = parts.slice(1).join(" ");

      setUsuarios(prev => [
        ...prev,
        {
          ID_USUARIO: Number(liderIdToSet),
          NOMBRE_USUARIO: nombre,
          APELLIDO_USUARIO: apellido,
          NIVEL_LIDERAZGO: null
        }
      ]);
    }

    // limpia pending una vez aplicado
    setPendingZona(null);
  }, [pendingZona, loadingMunicipios, loadingUsuarios, municipios, usuarios]);

  // --- Filtro (blindado) ---
  const filteredZonas = zonas.filter((zona) => {
    const term = (searchTerm ?? '').toLowerCase();
    const nombre = (zona?.NOMBRE_ZONA ?? '').toLowerCase();
    const municipio = (zona?.NOMBRE_MUNICIPIO ?? '').toLowerCase();
    const lider = (zona?.NOMBRE_LIDER ?? '').toLowerCase();
    return nombre.includes(term) || municipio.includes(term) || lider.includes(term);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Zonas</h1>
          <button
            onClick={handleRedirectToUsuarios}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Regresar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingId ? "Editar Zona" : "Registrar Nueva Zona"}
              </h2>
              {editingId && (
                <button onClick={resetForm} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Zona</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Map className="w-4 h-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="nombre_zona"
                    value={form.nombre_zona}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Hipódromo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Municipio Asignado</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    name="municipio_asignado"
                    value={form.municipio_asignado}
                    onChange={handleChange}
                    disabled={loadingMunicipios && !editingId}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="">{loadingMunicipios ? "Cargando..." : "Seleccionar municipio"}</option>
                    {municipios.map(m => (
                      <option key={m.ID_MUNICIPIO} value={String(m.ID_MUNICIPIO)}>
                        {m.NOMBRE_MUNICIPIO}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Líder Asignado</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-4 h-4 text-gray-400" />
                  </div>
                  <select
                    name="lider_zona"
                    value={form.lider_zona}
                    onChange={handleChange}
                    disabled={loadingUsuarios && !editingId}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                  >
                    <option value="">{loadingUsuarios ? "Cargando líderes..." : "Seleccionar un líder"}</option>
                    {usuarios
                      // Solo se excluyen los líderes de DEPARTAMENTO
                      .filter(u => u.NIVEL_LIDERAZGO !== 'DEPARTAMENTO')
                      .map(u => (
                        <option key={u.ID_USUARIO} value={String(u.ID_USUARIO)}>
                          {u.NOMBRE_USUARIO} {u.APELLIDO_USUARIO}
                        </option>
                      ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 rounded-lg font-medium text-white flex items-center justify-center transition-colors ${
                  saved ? "bg-green-500 hover:bg-green-600"
                  : loading ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {saved ? (<><Check className="w-4 h-4 mr-2" /> Guardado </>)
                : loading ? (<>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg> Guardando...
                </>) : (<><Save className="w-4 h-4 mr-2" /> {editingId ? "Actualizar Zona" : "Guardar Zona"} </>)}
              </button>
            </form>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Zonas Registradas</h2>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {loadingZonas ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Nombre</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Municipio</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Líder</th>
                      <th className="text-center py-2 px-2 text-sm font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredZonas.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-8 text-gray-500">No se encontraron zonas</td></tr>
                    ) : filteredZonas.map(zona => (
                      <tr key={zona.ID_ZONA} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2 text-sm font-medium text-gray-900">{zona.NOMBRE_ZONA || '—'}</td>
                        <td className="py-3 px-2 text-sm text-gray-700">{zona.NOMBRE_MUNICIPIO || '—'}</td>
                        <td className="py-3 px-2 text-sm text-gray-700">{zona.NOMBRE_LIDER || "No asignado"}</td>
                        <td className="py-3 px-2">
                          <div className="flex justify-center space-x-1">
                            <button onClick={() => handleEdit(zona)} className="p-1 rounded-full bg-blue-100 hover:bg-blue-200" title="Editar">
                              <Edit2 className="w-4 h-4 text-blue-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ZoneManagement;