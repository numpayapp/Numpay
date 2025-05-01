import { PrismaClient, User } from '@prisma/client'
import { CreateUserInput, UpdateUserInput } from '../../types'

const prisma = new PrismaClient()

export const userService = {
    // Create
    createUser: async (data: CreateUserInput): Promise<User> => {
        return prisma.user.create({
            data
        })
    },

    // Read
    getUserById: async (id: string): Promise<User | null> => {
        return prisma.user.findUnique({
            where: { privyDID: id }
        })
    },

    getUserByPhone: async (phoneNumber: string): Promise<User | null> => {
        return prisma.user.findUnique({
            where: { phoneNumber: phoneNumber }
        })
    },

    getUserByWallet: async (walletAddress: string): Promise<User | null> => {
        return prisma.user.findUnique({
            where: { walletAddress }
        })
    },

    getAllUsers: async (): Promise<User[]> => {
        return prisma.user.findMany({
            where: { deletedAt: null }
        })
    },

    // Update
    updateUser: async (id: string, data: UpdateUserInput): Promise<User> => {
        return prisma.user.update({
            where: { id },
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
    }
}