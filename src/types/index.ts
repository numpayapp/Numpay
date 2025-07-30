import { UserStatus, RequestType, RequestStatus, TransactionStatus, TransactionType } from '@prisma/client'

export type CreateUserInput = {
    privyDID: string
    name?: string
    phoneNumber: string
    walletAddress: string
    countryCode: string
}

export type UpdateUserInput = Partial<CreateUserInput> & {
    status?: UserStatus
    name?: string
    walletAddress?: string
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
    payerId: string
    payerPhone?: string
    amountRequested: number
    requestType: RequestType
    requestStatus: RequestStatus
    requestMessage?: string
    requestLink?: string
}

export type UpdateRequestInput = {
    requestStatus?: RequestStatus
    requestLink?: string
    requestMessage?: string
    requestType?: RequestType
    amountRequested?: number
    payerId?: string
    payerPhone?: string
    requestId?: string
    requestFrom?: string
    requestTo?: string
    requestDate?: Date
    requestTime?: Date
}