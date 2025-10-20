// src/components/Navbar.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('loggedIn');
    toast.info('Sesión cerrada correctamente');

    // Forzar recarga para que ProtectedRoute reevalúe
    setTimeout(() => {
      window.location.href = '/Admin_gold'; // fuerza navegación y limpieza de estado
    }, 1000);
  };


  return (
    <nav className="bg-gray-800 px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold text-yellow-400">SystemLect</h1>
      <button
        onClick={handleLogout}
        className="text-sm text-white bg-red-600 px-4 py-2 rounded hover:bg-red-500 transition"
      >
        Cerrar sesión
      </button>
    </nav>
  );
};

export default Navbar;
