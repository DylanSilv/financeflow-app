import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from "@/layouts/MainLayout";
import Dashboard from "@/features/dashboard/Dashboard";
import Cards from "@/features/cards/Cards";
import FixedExpenses from "@/features/fixed-expenses/FixedExpenses";
import TransactionHistory from "@/features/transactions/TransactionHistory";
import Savings from "@/features/savings/Savings";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Envolvemos las rutas de la app dentro del Layout principal */}
        <Route path="/" element={<MainLayout />}>
          {/* Ruta por defecto: Dashboard */}
          <Route index element={<Dashboard />} />
          
          {/* Ruta para la gestión de tarjetas */}
          <Route path="cards" element={<Cards />} />
          
          {/* Módulos temporales que redirigen al dashboard por ahora */}
          <Route path="transactions" element={<TransactionHistory />} />
          <Route path="fixed-expenses" element={<FixedExpenses />} />
          <Route path="savings" element={<Savings />} />
          <Route path="settings" element={<Navigate to="/" replace />} />
        </Route>

        {/* Cualquier ruta inválida vuelve al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;