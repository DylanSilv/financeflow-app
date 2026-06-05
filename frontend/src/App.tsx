import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from "@/layouts/MainLayout";
import Dashboard from "@/features/dashboard/Dashboard";
import Cards from "@/features/cards/Cards";
import FixedExpenses from "@/features/fixed-expenses/FixedExpenses";
import TransactionHistory from "@/features/transactions/TransactionHistory";
import Savings from "@/features/savings/Savings";
import { Login } from "@/features/auth/Login";
import { useAuthStore } from "@/store/useAuthStore";

function PrivateRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<PrivateRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="cards" element={<Cards />} />
            <Route path="transactions" element={<TransactionHistory />} />
            <Route path="fixed-expenses" element={<FixedExpenses />} />
            <Route path="savings" element={<Savings />} />
            <Route path="settings" element={<Navigate to="/" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;