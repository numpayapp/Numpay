import { PrismaClient, Transaction } from '../../generated/prisma'
import { CreateTransactionInput } from '../../types'

const prisma = new PrismaClient()

export const transactionService = {
    // Create
    createTransaction: async (data: CreateTransactionInput): Promise<Transaction> => {
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

    getTransactionByTxid: async (txid: string): Promise<Transaction | null> => {
        return prisma.transaction.findUnique({
            where: { txid },
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