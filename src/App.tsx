import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Admin_gold from './pages/Admin_gold';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';

import DashboardVotantesResumen from './pages/DashboardVotantesResumen';
import DepartmentManagement from './pages/DepartmentManagement';
import MunicipalityManagement from './pages/MunicipalityManagement';
import ZoneManagement from './pages/ZoneManagement';
import OrganizationalDashboard from './pages/OrganizationalDashboard';
import VoterMapView from './pages/VoterMapView';
import VotanteManagement from './pages/VotanteManagement';
import ReportesView from './pages/ReportesView';
import ReporteCamara from './pages/ReporteCamara';




import { Toaster } from 'sonner';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <>
      <Toaster richColors position="top-center" />

      <Routes>
        {/* RUTA PÚBLICA */}
        <Route path="/Admin_gold" element={<Admin_gold />} />

        {/* RUTAS PROTEGIDAS */}
        <Route path="/" element={<ProtectedRoute><DashboardVotantesResumen /></ProtectedRoute>} />

        <Route path="/Dash-Resumen-votantes" element={<ProtectedRoute><DashboardVotantesResumen /></ProtectedRoute>} />



        <Route path="/Usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
        <Route path="/Departamentos" element={<ProtectedRoute><DepartmentManagement /></ProtectedRoute>} />
        <Route path="/Minicipios" element={<ProtectedRoute><MunicipalityManagement /></ProtectedRoute>} />
        <Route path="/Zonas" element={<ProtectedRoute><ZoneManagement /></ProtectedRoute>} />
        <Route path="/Organizacion" element={<ProtectedRoute><OrganizationalDashboard /></ProtectedRoute>} />
        <Route path="/Mapa" element={<ProtectedRoute><VoterMapView /></ProtectedRoute>} />
        <Route path="/Promover-usuarios" element={<ProtectedRoute><VotanteManagement /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/reporte-camara" element={<ProtectedRoute><ReporteCamara /></ProtectedRoute>} />

        
        
        
        <Route path="/Reporte" element={<ProtectedRoute><ReportesView /></ProtectedRoute>} />
      </Routes>
    </>
  );
};

export default App;