import { PrismaClient, User, Transaction, Request } from '@prisma/client'
import { CreateUserInput, UpdateUserInput } from '../../types'

const prisma = new PrismaClient()

export const userService = {
    // Create
    createUser: async (data: CreateUserInput): Promise<User> => {
        data.phoneNumber = data.phoneNumber.replace(/[\s-]/g, "");
        return prisma.user.create({
            data
        })
    },

    // Read
    getUserById: async (id: string): Promise<Partial<User> | null> => {
        return prisma.user.findUnique({
            where: { privyDID: id },
            select: {
                id: true,
                privyDID: true,
                phoneNumber: true,
                walletAddress: true,
                countryCode: true,
                status: true,
                // Omit fields like deletedAt, createdAt, updatedAt, or any sensitive/internal fields
            }
        })
    },

    getUserByPhone: async (phoneNumber: string): Promise<Partial<User> | null> => {
        return prisma.user.findUnique({
            where: { phoneNumber: phoneNumber },
            select: {
                id: true,
                privyDID: true,
                phoneNumber: true,
                walletAddress: true,
                countryCode: true,
                status: true,
            }
        })
    },

    getUserByWallet: async (walletAddress: string): Promise<Partial<User> | null> => {
        return prisma.user.findUnique({
            where: { walletAddress },
            select: {
                id: true,
                privyDID: true,
                phoneNumber: true,
                walletAddress: true,
                countryCode: true,
                status: true,
            }
        })
    },

    getAllUsers: async (): Promise<Partial<User>[]> => {
        return prisma.user.findMany({
            where: { deletedAt: null },
            select: {
                id: true,
                privyDID: true,
                phoneNumber: true,
                walletAddress: true,
                countryCode: true,
                status: true,
            }
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
                OR: [
                    { senderId: userId },
                    { receiverId: userId }
                ]
            },
            include: {
                sender: {
                    select: {
                        name: true,
                        phoneNumber: true,
                        walletAddress: true
                    }
                },
                receiver: {
                    select: {
                        name: true,
                        phoneNumber: true,
                        walletAddress: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const requests = await prisma.request.findMany({
            where: {
                OR: [
                    { requesterId: userId },
                    { payerId: userId }
                ]
            },
            include: {
                requester: {
                    select: {
                        name: true,
                        phoneNumber: true,
                        walletAddress: true
                    }
                }
            },
            orderBy: {
                requestDate: 'desc'
            }
        });

        // Combine and sort all activities
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

        // Calculate totals
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