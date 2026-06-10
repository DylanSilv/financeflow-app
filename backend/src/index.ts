// backend/src/index.ts
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import dotenv from 'dotenv';
import logger from './lib/logger';
import { prisma } from './lib/Prisma';
import authRoutes from './routes/auth.routes';
import transactionRoutes from './routes/transaction.routes';
import dashboardRoutes from './routes/dashboard.routes';
import fixedExpenseRoutes from './routes/fixed-expense.routes';
import accountRoutes from './routes/account.routes';
import loanRoutes from './routes/loan.routes';
import savingsRoutes from './routes/savings.routes';
import cardRoutes     from './routes/card.routes';
import transferRoutes from './routes/transfer.routes';
import categoryRoutes from './routes/category.routes';

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(pinoHttp({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
  redact: ['req.headers.authorization'],
}));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'none'"],       // API pura — no sirve HTML ni recursos
      frameAncestors: ["'none'"],       // Previene clickjacking
      formAction:     ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,    // No necesario para una API REST
}));
const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? 'http://localhost:5173,http://localhost:5174').split(',');
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || CORS_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('CORS not allowed'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '50kb' }));

// Routes
app.use('/api/v1/auth',           authRoutes);
app.use('/api/v1/transactions',   transactionRoutes);
app.use('/api/v1/dashboard',      dashboardRoutes);
app.use('/api/v1/fixed-expenses', fixedExpenseRoutes);
app.use('/api/v1/accounts',       accountRoutes);
app.use('/api/v1/loans',          loanRoutes);
app.use('/api/v1/savings',        savingsRoutes);
app.use('/api/v1/cards',          cardRoutes);
app.use('/api/v1/transfers',      transferRoutes);
app.use('/api/v1/categories',    categoryRoutes);

// Root
app.get('/', (_req, res) => {
  res.status(200).json({
    name: 'FinTrack API',
    version: '1.0.0',
    status: 'running',
    endpoints: '/api/v1',
    health: '/health',
  });
});

// Health Check — verifica conectividad real con la DB
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'OK', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'ERROR', db: 'disconnected' });
  }
});

// 404 para rutas desconocidas
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// Error handler global — Express 5 propaga errores async aquí automáticamente
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  logger.info(`Server ready at http://localhost:${PORT}`);
});