import { PrismaClient, Transaction } from '@prisma/client'
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

    getTransactionByTxid: async (id: string): Promise<Transaction | null> => {
        return prisma.transaction.findUnique({
            where: { id },
            include: {
                sender: true,
                receiver: true
            }
        })
    },

    getUserTransactions: async (
        identifier: string,
        filter?: 'send' | 'receive' | 'request' | 'deposit'
    ): Promise<Transaction[]> => {
        // Resolve the real UUID from either id or privyDID
        let user = await prisma.user.findUnique({ where: { id: identifier } })
        if (!user) {
            user = await prisma.user.findUnique({ where: { privyDID: identifier } })
        }
        if (!user) {
            throw new Error('User not found')
        }
        const userId = user.id

        const conditions: any[] = []
        // Sent transactions
        if (!filter || filter === 'send') {
            conditions.push({
                senderId: userId,
                transactionType: 'SEND'
            })
        }

        // Received transactions
        if (!filter || filter === 'receive') {
            conditions.push({
                receiverId: userId,
                transactionType: 'RECEIVE'
            })
        }

        // Deposit transactions
        if (!filter || filter === 'deposit') {
            conditions.push({
                receiverId: userId,
                transactionType: 'DEPOSIT'
            })
        }

        return prisma.transaction.findMany({
            where: { OR: conditions },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: true,
                receiver: true
            }
        })
    },

    // Note: Transactions shouldn't be updated or deleted for integrity
}