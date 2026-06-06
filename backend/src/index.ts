// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import transactionRoutes from './routes/transaction.routes';
import dashboardRoutes from './routes/dashboard.routes';
import fixedExpenseRoutes from './routes/fixed-expense.routes';
import accountRoutes from './routes/account.routes';
import loanRoutes from './routes/loan.routes';
import savingsRoutes from './routes/savings.routes';
import cardRoutes from './routes/card.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/v1/auth',           authRoutes);
app.use('/api/v1/transactions',   transactionRoutes);
app.use('/api/v1/dashboard',      dashboardRoutes);
app.use('/api/v1/fixed-expenses', fixedExpenseRoutes);
app.use('/api/v1/accounts',       accountRoutes);
app.use('/api/v1/loans',          loanRoutes);
app.use('/api/v1/savings',        savingsRoutes);
app.use('/api/v1/cards',          cardRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'FinanceFlow API running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});