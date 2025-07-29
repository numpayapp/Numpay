import { z } from 'zod';

export const transactionValidatrecordTransactionSchemaionSchema = z.object({
    txHash: z.string().length(66, "Invalid transaction hash length"),
    senderAddress: z.string().length(42, "Invalid sender address length"),
    receiverAddress: z.string().length(42, "Invalid receiver address length"),
    amount: z.number().positive(),
    transactionStatus: z.enum(['PENDING', 'COMPLETED', 'FAILED']),
    transactionType: z.enum(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER']),
    walletAddress: z.string().length(42, "Invalid wallet address length").optional(),
    description: z.string().max(255).optional(),
    timestamp: z.date().optional(),
});

export const txHashSchema = z.object({
    txHash: z.string().length(66, "Invalid transaction hash length"),
});

export const getUserTransactionsSchema = z.object({
    userId: z.string().uuid(),
    type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'TRANSFER']).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    offset: z.number().int().min(0).optional(),
});

export const getTransactionStatsSchema = z.object({
    userId: z.string().uuid(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
});