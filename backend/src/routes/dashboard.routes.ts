import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import {
  getBalanceTotal,
  getBalancePorCuenta,
  getGastosPorCategoria,
  getIngresosPorMes,
  getEvolucionPatrimonial,
  getPrestamosActivos,
  getObjetivosAhorro,
} from '../controllers/dashboard.controller';

const router = Router();

router.use(requireAuth);

router.get('/balance-total',    getBalanceTotal);
router.get('/balance-cuentas',  getBalancePorCuenta);
router.get('/gastos-categoria', getGastosPorCategoria);
router.get('/ingresos-mes',     getIngresosPorMes);
router.get('/evolucion',        getEvolucionPatrimonial);
router.get('/prestamos',        getPrestamosActivos);
router.get('/ahorros',          getObjetivosAhorro);

export default router;
