import { Router } from 'express';
import {
  recordTransaction,
  getTransactionById,
  getTransactionByTxHash,
  getUserTransactions,
  getTransactionStats
} from '../controllers/transaction/transaction.controller';
import { executeTransfer } from '../controllers/transaction/executeTransfer.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// Execute Solana USDC transfer (server-signed via Privy)
router.post('/execute-transfer', authenticateUser, executeTransfer);

// Create new transaction (manual record, kept for backwards compat)
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
