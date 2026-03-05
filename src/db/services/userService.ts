import { PrismaClient, User } from '@prisma/client'
import { CreateUserInput, UpdateUserInput } from '../../types'

const prisma = new PrismaClient()

const userSelect = {
    id: true,
    privyDID: true,
    phoneNumber: true,
    name: true,
    solanaAddress: true,
    privyWalletId: true,
    countryCode: true,
    status: true,
} as const;

export const userService = {
    // Create
    createUser: async (data: CreateUserInput): Promise<User> => {
        data.phoneNumber = data.phoneNumber.replace(/[\s-]/g, "");
        return prisma.user.create({ data })
    },

    // Read
    getUserById: async (id: string): Promise<Partial<User> | null> => {
        return prisma.user.findUnique({
            where: { privyDID: id },
            select: userSelect,
        })
    },

    getUserByPhone: async (phoneNumber: string): Promise<Partial<User> | null> => {
        return prisma.user.findUnique({
            where: { phoneNumber },
            select: userSelect,
        })
    },

    getUserBySolanaAddress: async (solanaAddress: string): Promise<Partial<User> | null> => {
        return prisma.user.findUnique({
            where: { solanaAddress },
            select: userSelect,
        })
    },

    // Keep old name for backwards compatibility with any remaining callers
    getUserByWallet: async (walletAddress: string): Promise<Partial<User> | null> => {
        return prisma.user.findFirst({
            where: {
                OR: [
                    { walletAddress },
                    { solanaAddress: walletAddress },
                ]
            },
            select: userSelect,
        })
    },

    getAllUsers: async (): Promise<Partial<User>[]> => {
        return prisma.user.findMany({
            where: { deletedAt: null },
            select: userSelect,
        })
    },

    // Update
    updateUser: async (id: string, data: UpdateUserInput): Promise<User> => {
        return prisma.user.update({
            where: { privyDID: id },
            data
        })
    },

    // Delete (Soft Delete)
    deleteUser: async (id: string): Promise<User> => {
        return prisma.user.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                status: 'INACTIVE'
            }
        })
    },

    getUserTransactionSummary: async (userId: string) => {
        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [{ senderId: userId }, { receiverId: userId }]
            },
            include: {
                sender: {
                    select: { name: true, phoneNumber: true, solanaAddress: true }
                },
                receiver: {
                    select: { name: true, phoneNumber: true, solanaAddress: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        const requests = await prisma.request.findMany({
            where: {
                OR: [{ requesterId: userId }, { payerId: userId }]
            },
            include: {
                requester: {
                    select: { name: true, phoneNumber: true, solanaAddress: true }
                }
            },
            orderBy: { requestDate: 'desc' }
        });

        const allActivities = [
            ...transactions.map(t => ({
                ...t,
                type: 'TRANSACTION',
                date: t.createdAt,
                amount: t.amount,
                isOutgoing: t.senderId === userId
            })),
            ...requests.map(r => ({
                ...r,
                type: 'REQUEST',
                date: r.requestDate,
                amount: r.amountRequested,
                isOutgoing: r.requesterId === userId
            }))
        ].sort((a, b) => b.date.getTime() - a.date.getTime());

        const totalSent = transactions
            .filter(t => t.senderId === userId)
            .reduce((sum, t) => sum + t.amount, 0);

        const totalReceived = transactions
            .filter(t => t.receiverId === userId)
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            activities: allActivities,
            summary: {
                totalSent,
                totalReceived,
                netBalance: totalReceived - totalSent,
                totalTransactions: transactions.length,
                totalRequests: requests.length
            }
        };
    }
}
