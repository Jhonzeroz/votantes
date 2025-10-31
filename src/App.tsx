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







import { Toaster } from 'sonner';
import ProtectedRoute from './components/ProtectedRoute';


const App: React.FC = () => {
  return (
    <>
      <Toaster richColors position="top-center" />

      <Routes>
        <Route index element={<DashboardVotantesResumen />} />
        <Route path="/Admin_gold" element={<Admin_gold />} />


        <Route path="/DashboardVotantesResumen" element={<DashboardVotantesResumen />} />
        <Route path="/Usuarios" element={<Usuarios />} />
        <Route path="/Departamentos" element={<DepartmentManagement />} />
        <Route path="/Minicipios" element={<MunicipalityManagement />} />
        <Route path="/Zonas" element={<ZoneManagement />} />
        <Route path="/Organizacion" element={<OrganizationalDashboard />} />
        <Route path="/Mapa" element={<VoterMapView />} />
        <Route path="/VotanteManagement" element={<VotanteManagement />} />






        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;
