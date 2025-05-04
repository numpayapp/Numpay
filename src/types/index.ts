import { UserStatus, RequestType, RequestStatus, TransactionStatus, TransactionType } from '@prisma/client'

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
    transactionType: TransactionType
    senderId: string
    receiverId: string
    amount: number
    transactionStatus: TransactionStatus
}

export type CreateRequestInput = {
    requesterId: string
    requestToId: string
    amountRequested: number
    requestType: RequestType
    requestStatus: RequestStatus
}

export type UpdateRequestInput = {
    requestStatus: RequestStatus
}