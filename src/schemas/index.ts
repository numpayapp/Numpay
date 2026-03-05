import { z } from 'zod';

export const createUserSchema = z.object({
    privyDID: z.string(),
    phoneNumber: z.string().min(10).max(15),
    walletAddress: z.string().optional(),
    solanaAddress: z.string().min(32).max(44).optional(),
    privyWalletId: z.string().optional(),
    countryCode: z.string().optional()
});

export const pregenerateWalletSchema = z.object({
    phoneNumber: z.string().min(10).max(15),
    countryCode: z.string().optional(),
});

export const idRequestSchema = z.object({
    id: z.string().uuid(),
});

export const privyDIDSchema = z.object({
    id: z.string().startsWith("did:privy:", "Invalid Privy DID format"),
});

export const phoneNumberSchema = z.object({
    phoneNumber: z.string().min(10).max(15),
    countryCode: z.string().optional(),
});

export const walletAddressSchema = z.object({
    address: z.string().min(32).max(44),
});

export const updateUserSchema = z.object({
    id: z.string().startsWith("did:privy:", "Invalid Privy DID format"),
    phoneNumber: z.string().min(10).max(15).optional(),
    walletAddress: z.string().optional(),
    countryCode: z.string().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});