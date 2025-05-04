import { Request, Response } from "express";
import { transactionService } from "../../db/services/transactionService";
import prisma from "../../db/prisma";

export const recordTransaction = async (req: Request, res: Response) => {
    try {
        const { txhash, senderAddress, receiverAddress, amount, transactionType, transactionStatus } = req.body;

        // Validate input
        if (!senderAddress || !txhash || !receiverAddress || !amount || !transactionType || !transactionStatus) {
            res.status(400).json({ message: "All fields are required" });
        }

        const sender = await prisma.user.findUnique({
            where: { walletAddress: senderAddress },
        });
        if (!sender) {
            res.status(404).json({ message: 'Sender user not found' });
            return;
        }
        const receiver = await prisma.user.findUnique({
            where: { walletAddress: receiverAddress },
        });
        if (!receiver) {
            res.status(404).json({ message: 'Receiver user not found' });
            return;
        }

        // Record the transaction in the database
        const transaction = await transactionService.createTransaction({
            txhash,
            transactionType,
            senderId: sender.id,
            receiverId: receiver.id,
            amount: amount,
            transactionStatus
        });

        res.status(201).json(transaction);
    } catch (error) {
        console.error("Error recording transaction:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getTransactionById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const transaction = await transactionService.getTransactionById(id);

        if (!transaction) {
            res.status(404).json({ message: "Transaction not found" });
        }

        res.status(200).json(transaction);
    } catch (error) {
        console.error("Error fetching transaction:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getTransactionByTxHash = async (req: Request, res: Response) => {
    try {
        const { txhash } = req.params;

        const transaction = await transactionService.getTransactionByTxid(txhash);

        if (!transaction) {
            res.status(404).json({ message: "Transaction not found" });
        }

        res.status(200).json(transaction);
    } catch (error) {
        console.error("Error fetching transaction:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUserTransactions = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { type } = req.query;

        const transactions = await transactionService.getUserTransactions(userId, type as any);

        res.status(200).json(transactions);
    } catch (error) {
        console.error("Error fetching user transactions:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getTransactionStats = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;

        const transactions = await transactionService.getUserTransactions(userId);

        // Filter by date range if provided
        const filteredTransactions = transactions.filter(t => {
            if (!startDate || !endDate) return true;
            const txDate = new Date(t.createdAt);
            return txDate >= new Date(startDate as string) &&
                txDate <= new Date(endDate as string);
        });

        const stats = {
            totalSent: filteredTransactions
                .filter(t => t.senderId === userId)
                .reduce((sum, t) => sum + t.amount, 0),
            totalReceived: filteredTransactions
                .filter(t => t.receiverId === userId)
                .reduce((sum, t) => sum + t.amount, 0),
            transactionCount: filteredTransactions.length
        };

        res.status(200).json(stats);
    } catch (error) {
        console.error("Error fetching transaction stats:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};