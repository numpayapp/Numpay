import { PrismaClient, Request } from '@prisma/client'
import { CreateRequestInput, UpdateRequestInput } from '../../types'
import { cancelRequest } from '../../controllers/request/request.controller'

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
                    { payerId: userId }
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
                payerId: userId,
                requestStatus: 'PENDING'
            },
            include: {
                requester: true,
                requestFrom: true
            }
        })
    },

    // write function to cancel request
    cancelRequest: async (requestId: string): Promise<Request> => {
        return prisma.request.update({
            where: { id: requestId },
            data: {
                requestStatus: 'CANCELED'
            },
            include: {
                requester: true,
                requestFrom: true
            }
        })
    },

    // Update
    // updateRequestStatus: async (id: string, data: UpdateRequestInput): Promise<Request> => {
    //     return prisma.request.update({
    //         where: { id },
    //         data,
    //         include: {
    //             requester: true,
    //             requestFrom: true
    //         }
    //     })
    // }
}