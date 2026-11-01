import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Accounts } from './pages/Accounts';
import { Transfer } from './pages/Transfer';
import { Deposit } from './pages/Deposit';
import { Withdraw } from './pages/Withdraw';
import { Transactions } from './pages/Transactions';
import { Beneficiaries } from './pages/Beneficiaries';
import { Analytics } from './pages/Analytics';
import { Profile } from './pages/Profile';

import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminAccounts } from './pages/admin/AdminAccounts';
import { AdminFraudAlerts } from './pages/admin/AdminFraudAlerts';
import { AdminReconciliation } from './pages/admin/AdminReconciliation';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#070d19] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Dynamic ambient liquid water glows */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.08),rgba(255,255,255,0))] pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex overflow-hidden">
          {user && <Sidebar />}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

const RootRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'Admin' || user.role === 'Manager') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Customer Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Customer', 'Admin', 'Manager']} />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/transfer" element={<Transfer />} />
              <Route path="/deposit" element={<Deposit />} />
              <Route path="/withdraw" element={<Withdraw />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/beneficiaries" element={<Beneficiaries />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Protected Admin & Manager Routes */}
            <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/admin/accounts" element={<AdminAccounts />} />
              <Route path="/admin/fraud-alerts" element={<AdminFraudAlerts />} />
              <Route path="/admin/reconciliation" element={<AdminReconciliation />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
