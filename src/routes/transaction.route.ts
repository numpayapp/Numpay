import { Router } from 'express';
import {
  recordTransaction,
  getTransactionById,
  getTransactionByTxHash,
  getUserTransactions,
  getTransactionStats
} from '../controllers/transaction/transaction.controller';

const router = Router();

// Create new transaction
router.post('/', recordTransaction);

// Get transaction by ID
router.get('/:id', getTransactionById);

// Get transaction by hash
router.get('/tx/:txhash', getTransactionByTxHash);

// Get user transactions with optional filtering
router.get('/user/:userId', getUserTransactions);

// Get transaction statistics
router.get('/stats/:userId', getTransactionStats);

export default router;
