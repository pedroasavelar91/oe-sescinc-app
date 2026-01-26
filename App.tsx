import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/AppStore';
import { ToastProvider } from './components/ToastProvider';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/Users';
import { CoursesPage } from './pages/Courses';
import { ClassesPage } from './pages/Classes';
import { StudentsPage } from './pages/Students';
import { TasksPage } from './pages/Tasks';
import { EvaluationsPage } from './pages/Evaluations';
import { FinancePage } from './pages/Finance';
import { ProfilePage } from './pages/Profile';
import { AttendancePage } from './pages/Attendance';
import { ChecklistMedTruckPage } from './pages/ChecklistMedTruck';
import { ChecklistEquipamentosPage } from './pages/ChecklistEquipamentos';
import { ChecklistCursoPage } from './pages/ChecklistCurso';
import { CertificatesPage } from './pages/Certificates';
import { FirefightersPage } from './pages/Firefighters';
import { DocumentsPage } from './pages/Documents';
import { SetupTeardownPage } from './pages/SetupTeardown';
import { QuestionBankPage } from './pages/QuestionBank';
import { OrganogramPage } from './pages/Organogram';
import { SchedulePage } from './pages/Schedule';
import { isSupabaseConfigured } from './services/supabase';
import { AlertTriangle } from 'lucide-react';
import { ClassPhotosPage } from './pages/ClassPhotos';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useStore();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50">
        <div className="spinner mb-4"></div>
        <p className="text-gray-600 font-medium animate-pulse">Carregando sistema...</p>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  const { currentUser, loading } = useStore();
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
        <div className="card-premium p-8 max-w-md text-center animate-scale-in">
          <div className="inline-flex p-4 bg-yellow-100 rounded-full mb-4">
            <AlertTriangle size={48} className="text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuração Necessária</h1>
          <p className="text-gray-600 mb-4">
            O sistema não detectou as chaves do banco de dados <strong>Supabase</strong>.
          </p>
          <div className="text-sm text-gray-600 mb-6 text-left bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="font-semibold mb-2">Variáveis de ambiente necessárias:</p>
            <code className="block bg-white px-2 py-1 rounded border mb-1">SUPABASE_URL</code>
            <code className="block bg-white px-2 py-1 rounded border">SUPABASE_KEY</code>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn-premium bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-6 py-3 rounded-lg w-full font-semibold transition-all duration-200"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-blue-50">
        <div className="spinner mb-4"></div>
        <p className="text-gray-600 font-medium animate-pulse">Conectando ao banco de dados...</p>
        <p className="text-gray-400 text-sm mt-2">Aguarde um momento</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" /> : <Login />} />

      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/organogram" element={<ProtectedRoute><OrganogramPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
      <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
      <Route path="/classes" element={<ProtectedRoute><ClassesPage /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
      <Route path="/evaluations" element={<ProtectedRoute><EvaluationsPage /></ProtectedRoute>} />
      <Route path="/checklist-medtruck" element={<ProtectedRoute><ChecklistMedTruckPage /></ProtectedRoute>} />
      <Route path="/checklist-equipamentos" element={<ProtectedRoute><ChecklistEquipamentosPage /></ProtectedRoute>} />
      <Route path="/checklist-curso" element={<ProtectedRoute><ChecklistCursoPage /></ProtectedRoute>} />
      <Route path="/finance" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/certificates" element={<ProtectedRoute><CertificatesPage /></ProtectedRoute>} />
      <Route path="/firefighters" element={<ProtectedRoute><FirefightersPage /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
      <Route path="/setup-teardown" element={<ProtectedRoute><SetupTeardownPage /></ProtectedRoute>} />
      <Route path="/schedule" element={<ProtectedRoute><SchedulePage /></ProtectedRoute>} />
      <Route path="/class-photos" element={<ProtectedRoute><ClassPhotosPage /></ProtectedRoute>} />
      <Route path="/question-bank" element={<ProtectedRoute><QuestionBankPage /></ProtectedRoute>} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <StoreProvider>
      <ToastProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </ToastProvider>
    </StoreProvider>
  );
};

export default App;