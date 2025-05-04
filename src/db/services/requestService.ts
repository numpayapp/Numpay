import { PrismaClient, Request } from '@prisma/client'
import { CreateRequestInput, UpdateRequestInput } from '../../types'

const prisma = new PrismaClient()

export const requestService = {
    // Create
    createRequest: async (data: CreateRequestInput): Promise<Request> => {
        return prisma.request.create({
            data
        })
    },

    // Read
    getRequestById: async (id: string): Promise<Request | null> => {
        return prisma.request.findUnique({
            where: { id },
            include: {
                requester: true,
                requestFrom: true
            }
        })
    },

    getUserRequests: async (userId: string): Promise<Request[]> => {
        return prisma.request.findMany({
            where: {
                OR: [
                    { requesterId: userId },
                    { requestToId: userId }
                ]
            },
            include: {
                requester: true,
                requestFrom: true
            }
        })
    },

    getPendingRequests: async (userId: string): Promise<Request[]> => {
        return prisma.request.findMany({
            where: {
                requestToId: userId,
                requestStatus: 'PENDING'
            },
            include: {
                requester: true,
                requestFrom: true
            }
        })
    },

    // Update
    updateRequestStatus: async (id: string, data: UpdateRequestInput): Promise<Request> => {
        return prisma.request.update({
            where: { id },
            data,
            include: {
                requester: true,
                requestFrom: true
            }
        })
    }
}