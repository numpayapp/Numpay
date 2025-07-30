import { PrismaClient, Request, RequestStatus } from '@prisma/client'
import { CreateRequestInput, UpdateRequestInput } from '../../types'
import { cancelRequest } from '../../controllers/request/request.controller'

const prisma = new PrismaClient()

export const requestService = {
    // Create
    createRequest: async (requestData: CreateRequestInput): Promise<Request> => {
        return prisma.request.create({
            data: {
                requester: { connect: { id: requestData.requesterId } },
                ...(requestData.payerId !== undefined ? { payer: { connect: { id: requestData.payerId } } } : {}),
                payerPhone: requestData.payerPhone,
                amountRequested: requestData.amountRequested,
                requestType: requestData.requestType,
                requestStatus: requestData.requestStatus,
                requestMessage: requestData.requestMessage,
                requestLink: requestData.requestLink
            },
            include: {
                requester: true,
                requestFrom: true
            }
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

    updateRequestStatus: async (requestId: string, status: RequestStatus): Promise<Request> => {
        return prisma.request.update({
            where: { id: requestId },
            data: {
                requestStatus: status,
            },
            include: {
                requester: true,
                requestFrom: true
            }
        })
    }
}