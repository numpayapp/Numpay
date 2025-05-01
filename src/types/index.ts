import { User, Transaction, Request, UserStatus, RequestType, RequestStatus } from '../generated/prisma'

export type CreateUserInput = {
    privyDID: string
    name?: string
    phoneNumber: string
    walletAddress: string
}

export type UpdateUserInput = Partial<CreateUserInput> & {
    status?: UserStatus
}

export type CreateTransactionInput = {
    txhash: string
    senderId: string
    receiverId: string
    amountSent: number
    decimals?: number
}

export type CreateRequestInput = {
    requesterId: string
    requestType: RequestType
    requestFromId: string
    amountRequested: number
}

export type UpdateRequestInput = {
    requestStatus: RequestStatus
}