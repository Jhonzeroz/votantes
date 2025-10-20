import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import type { ReactElement } from 'react';

interface Props {
  children: ReactElement;
  allowedRoles?: number[]; // Array de roles permitidos
}

interface DecodedToken {
  exp: number;
  tipo_usuario: number;
}

const ProtectedRoute: React.FC<Props> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/Admin_gold" />;
  }

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const now = Date.now() / 1000;

    if (decoded.exp < now) {
      localStorage.removeItem('token');
      return <Navigate to="/Admin_gold" />;
    }

    // Si se definieron roles permitidos, validar
    if (allowedRoles && !allowedRoles.includes(decoded.tipo_usuario)) {
      return <Navigate to="/" />;
    }

    return children;
  } catch (err) {
    console.error('Token inválido:', err);
    localStorage.removeItem('token');
    return <Navigate to="/Admin_gold" />;
  }
};

export default ProtectedRoute;
