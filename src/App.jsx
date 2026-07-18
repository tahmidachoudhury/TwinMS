import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AnalyticsDashboard from './pages/AnalyticsDashboard.jsx';
import ClinicianDashboard from './pages/ClinicianDashboard.jsx';
import Corners from './components/Corners.jsx';
import { getCurrentPatientId, getCurrentRole } from './auth.js';

function HomeRedirect() {
  if (getCurrentRole() === 'clinician') return <Navigate to="/clinician" replace />;
  const id = getCurrentPatientId();
  return <Navigate to={id ? `/dashboard/${id}` : '/login'} replace />;
}

export default function App() {
  return (
    <>
      <Corners />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard/:patientId" element={<Dashboard />} />
        <Route path="/analytics-dashboard" element={<AnalyticsDashboard />} />
        <Route path="/clinician" element={<ClinicianDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
