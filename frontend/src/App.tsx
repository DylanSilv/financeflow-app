import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'; // Navigate used in catch-all route
import { MainLayout } from "@/layouts/MainLayout";
import Dashboard from "@/features/dashboard/Dashboard";
import Cards from "@/features/cards/Cards";
import FixedExpenses from "@/features/fixed-expenses/FixedExpenses";
import TransactionHistory from "@/features/transactions/TransactionHistory";
import Savings from "@/features/savings/Savings";
import Settings from "@/features/settings/Settings";
import { Login }    from "@/features/auth/Login";
import { Register } from "@/features/auth/Register";
import Loans from "@/features/loans/Loans";
import Accounts from "@/features/accounts/Accounts";
import Categories from "@/features/categories/Categories";
import { useAuthStore } from "@/store/useAuthStore";
import Landing from "@/features/landing/Landing";

function PrivateRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Landing />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<PrivateRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="cards" element={<Cards />} />
            <Route path="transactions" element={<TransactionHistory />} />
            <Route path="fixed-expenses" element={<FixedExpenses />} />
            <Route path="loans" element={<Loans />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="categories" element={<Categories />} />
            <Route path="savings" element={<Savings />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;