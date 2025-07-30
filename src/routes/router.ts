import userRoutes from './user.route';
import transactionRoutes from './transaction.route';
import requestRoute from './request.route';
import { Router } from 'express';

const router = Router();

router.use('/user', userRoutes);
router.use('/transaction', transactionRoutes);
router.use('/request', requestRoute);

export default router;