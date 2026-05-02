import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './pages/DashboardLayout';
import DashboardAdmin from './pages/DashboardAdmin';
import DashboardEnseignant from './pages/DashboardEnseignant';
import DashboardDelegue from './pages/DashboardDelegue';
import DashboardEtudiant from './pages/DashboardEtudiant'; // ← AJOUT
import EmploiTempsPage from './pages/EmploiTempsPage';
import PointagePage from './pages/PointagePage';
import CahierPage from './pages/CahierPage';
import VacationPage from './pages/VacationPage';
import ClassesPage from './pages/ClassesPage';
import EnseignantsPage from './pages/EnseignantsPage';
import MatieresPage from './pages/MatieresPage';
import SallesPage from './pages/SallesPage';
import RapportsPage from './pages/RapportsPage';
import PointageManuelPage from './pages/PointageManuelPage';
import EtudiantsPage from './pages/EtudiantsPage'; 

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
            <Route path="dashboard/admin"       element={<PrivateRoute roles={['administrateur']}><DashboardAdmin /></PrivateRoute>} />
            <Route path="dashboard/enseignant"  element={<PrivateRoute roles={['enseignant']}><DashboardEnseignant /></PrivateRoute>} />
            <Route path="dashboard/delegue"     element={<PrivateRoute roles={['delegue']}><DashboardDelegue /></PrivateRoute>} />
            <Route path="dashboard/surveillant" element={<PrivateRoute roles={['surveillant']}><DashboardAdmin /></PrivateRoute>} />
            <Route path="dashboard/comptable"   element={<PrivateRoute roles={['comptable']}><DashboardAdmin /></PrivateRoute>} />
            <Route path="dashboard/etudiant"    element={<PrivateRoute roles={['etudiant']}><DashboardEtudiant /></PrivateRoute>} />
            <Route path="admin/etudiants" element={<PrivateRoute roles={['administrateur']}><EtudiantsPage /></PrivateRoute>} />
            <Route path="emploi-temps"          element={<PrivateRoute><EmploiTempsPage /></PrivateRoute>} />
            <Route path="emploi-temps/etudiant" element={<PrivateRoute roles={['etudiant']}><EmploiTempsPage /></PrivateRoute>} />
            <Route path="pointage"              element={<PrivateRoute roles={['administrateur','enseignant']}><PointagePage /></PrivateRoute>} />
            <Route path="cahiers"               element={<PrivateRoute><CahierPage /></PrivateRoute>} />
            <Route path="vacations"             element={<PrivateRoute><VacationPage /></PrivateRoute>} />
            <Route path="admin/classes"         element={<PrivateRoute roles={['administrateur']}><ClassesPage /></PrivateRoute>} />
            <Route path="admin/enseignants"     element={<PrivateRoute roles={['administrateur']}><EnseignantsPage /></PrivateRoute>} />
            <Route path="admin/matieres"        element={<PrivateRoute roles={['administrateur']}><MatieresPage /></PrivateRoute>} />
            <Route path="admin/salles"          element={<PrivateRoute roles={['administrateur']}><SallesPage /></PrivateRoute>} />
            <Route path="rapports"              element={<PrivateRoute roles={['administrateur','surveillant']}><RapportsPage /></PrivateRoute>} />
            <Route path="pointage-manuel"       element={<PrivateRoute roles={['surveillant','administrateur']}><PointageManuelPage /></PrivateRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;