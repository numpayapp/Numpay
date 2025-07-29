import { Router } from 'express';
import {
  recordTransaction,
  getTransactionById,
  getTransactionByTxHash,
  getUserTransactions,
  getTransactionStats
} from '../controllers/transaction/transaction.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// Create new transaction
router.post('/', authenticateUser, recordTransaction);

// Get transaction by ID
router.get('/:id', authenticateUser, getTransactionById);

// Get transaction by hash
router.get('/tx/:txhash', authenticateUser, getTransactionByTxHash);

// Get user transactions with optional filtering
router.get('/user/:userId', authenticateUser, getUserTransactions);

// Get transaction statistics
router.get('/stats/:userId', authenticateUser, getTransactionStats);

export default router;
