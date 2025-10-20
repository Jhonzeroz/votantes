import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import LogoGoldRoom from '../assets/logo.png';

import {
  Power,


  UploadCloud,

  UserCog,
} from 'lucide-react';

import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  id: number;
  nombre: string;
  tipo_usuario: number;
  iat: number;
  exp: number;
}

const Navbar: React.FC = () => {
  const [tipoUsuario, setTipoUsuario] = useState<number | null>(null);
  const [nombreUsuario, setNombreUsuario] = useState<string>('');
  const [suscripcionHasta, setSuscripcionHasta] = useState<string | null>(null);
  const [estadoSuscripcion, setEstadoSuscripcion] = useState<number | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [idUsuario, setIdUsuario] = useState<number | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const rutaActual = location.pathname;
  useEffect(() => {
    console.log("🔁 Cambios de estado:");
    console.log("📌 tipoUsuario:", tipoUsuario);
    console.log("📌 idUsuario:", setCancelando);
  }, [tipoUsuario, cancelando, idUsuario, suscripcionHasta, estadoSuscripcion]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded.exp < Date.now() / 1000) {
          localStorage.clear();
          toast.error('Sesión expirada');
          navigate('/Admin_gold');
        } else {
          setTipoUsuario(decoded.tipo_usuario);
          setNombreUsuario(decoded.nombre);
          setIdUsuario(decoded.id);

          if (decoded.tipo_usuario === 0) {
            fetch(`https://odin.datainsightscloud.com/listar_suscripciones_usuario.php?id_usuario=${decoded.id}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.success && data.finaliza_en) {
                  setSuscripcionHasta(data.finaliza_en);
                  setEstadoSuscripcion(data.estado_suscripcion);
                }
              });
          }
        }
      } catch (error) {
        localStorage.clear();
        navigate('/Admin_gold');
      }
    } else {
      navigate('/Admin_gold');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    toast.info('Sesión cerrada correctamente');
    setTimeout(() => navigate('/Admin_gold'), 800);
  };

  const menu = [
    { label: 'Dashboard', icon: <UserCog size={18} />, path: '/dashboard' },
    { label: 'Dashboard', icon: <UploadCloud size={18} />, path: '/DashboardVotantesResumen' },

  ];

  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-[#111827] shadow-md">
      <div className="flex items-center gap-3 cursor-default">
        <img src={LogoGoldRoom} alt="Logo" className="w-8 h-8 md:w-10 md:h-10" />
        <span className="text-2xl font-extrabold bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-transparent bg-clip-text">
          Votantes
        </span>
        {nombreUsuario && (
          <span className="text-sm text-gray-300 font-medium border-l border-gray-600 pl-3 truncate max-w-[500px] flex items-center gap-2">
            {nombreUsuario}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {menu.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            disabled={rutaActual === item.path}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-semibold transition ${rutaActual === item.path
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-gradient-to-r from-[#D4AF37] to-[#B8860B] text-black hover:scale-105'
              }`}
          >
            {item.icon}
            <span className="hidden md:inline">{item.label}</span>
          </button>
        ))}

        <button
          onClick={handleLogout}
          className="p-2 bg-red-600 hover:bg-red-500 rounded-full text-white relative group transition"
          title="Cerrar sesión"
        >
          <Power size={20} />
          <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition pointer-events-none">
            Cerrar sesión
          </span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
