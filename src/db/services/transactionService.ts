import { PrismaClient, Transaction } from '@prisma/client'
import { CreateTransactionInput } from '../../types'

const prisma = new PrismaClient()

export const transactionService = {
    // Create
    createTransaction: async (data: Transaction): Promise<Transaction> => {
        return prisma.transaction.create({
            data
        })
    },

    // Read
    getTransactionById: async (id: string): Promise<Transaction | null> => {
        return prisma.transaction.findUnique({
            where: { id },
            include: {
                sender: true,
                receiver: true
            }
        })
    },

    getTransactionByTxid: async (id: string): Promise<Transaction | null> => {
        return prisma.transaction.findUnique({
            where: { id },
            include: {
                sender: true,
                receiver: true
            }
        })
    },

    getUserTransactions: async (userId: string): Promise<Transaction[]> => {
        return prisma.transaction.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            include: {
                sender: true,
                receiver: true
            }
        })
    },

    // Note: Transactions shouldn't be updated or deleted for integrity
}