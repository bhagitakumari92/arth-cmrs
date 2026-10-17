import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import LoansPage from './pages/LoansPage';
import LoanDetailPage from './pages/LoanDetailPage';
import CollectionsPage from './pages/CollectionsPage';
import SubmissionsPage from './pages/SubmissionsPage';
import ReconciliationPage from './pages/ReconciliationPage';
import DepositsPage from './pages/DepositsPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import BranchesPage from './pages/BranchesPage';
import Spinner from './components/Spinner';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" text="Loading..." />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <MainLayout>{children}</MainLayout>;
}

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner size="lg" text="Loading ARTH CMRS..." />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
        <Route path="/loans" element={<ProtectedRoute><LoansPage /></ProtectedRoute>} />
        <Route path="/loans/:id" element={<ProtectedRoute><LoanDetailPage /></ProtectedRoute>} />
        <Route path="/collections" element={<ProtectedRoute><CollectionsPage /></ProtectedRoute>} />
        <Route path="/submissions" element={<ProtectedRoute><SubmissionsPage /></ProtectedRoute>} />
        <Route path="/reconciliation" element={<ProtectedRoute><ReconciliationPage /></ProtectedRoute>} />
        <Route path="/deposits" element={<ProtectedRoute><DepositsPage /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
        <Route path="/branches" element={<ProtectedRoute><BranchesPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
