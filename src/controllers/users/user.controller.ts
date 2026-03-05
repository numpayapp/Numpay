import { Request, Response } from 'express';
import { userService } from "../../db/services/userService";
import { UpdateUserInput } from "../../types";
import { privy } from '../../services/privy';
import { createUserSchema, idRequestSchema, phoneNumberSchema, pregenerateWalletSchema, privyDIDSchema, updateUserSchema, walletAddressSchema } from '../../schemas';
import { logger } from '../../utils/logger';
import { getUsdcBalance } from '../../services/solana';

export const createUser = async (req: Request, res: Response) => {
    try {
        const { privyDID, phoneNumber } = req.body;

        if (!privyDID || !phoneNumber) {
            return res.status(400).json({ message: "privyDID and phoneNumber are required" });
        }

        const sanitizedPhone = phoneNumber.replace(/[\s-]/g, "");
        const countryCode = sanitizedPhone.split(" ")[0] || sanitizedPhone.slice(0, 3);

        logger.logUserAction("Processing user registration", privyDID, { phoneNumber: sanitizedPhone });

        // Return if already registered by privyDID
        const existingByDID = await userService.getUserById(privyDID);
        if (existingByDID) {
            return res.status(200).json(existingByDID);
        }

        // Merge if a pregenerated record exists for this phone
        const existingByPhone = await userService.getUserByPhone(sanitizedPhone);
        if (existingByPhone && (existingByPhone.privyDID as string)?.startsWith('pregenerated:')) {
            const updated = await userService.updateUser(existingByPhone.privyDID as string, { privyDID });
            return res.status(200).json(updated);
        }
        if (existingByPhone) {
            return res.status(200).json(existingByPhone);
        }

        // Create a Privy server wallet for this user
        const wallet = await privy.wallets().create({ chain_type: 'solana' });

        const result = await userService.createUser({
            privyDID,
            phoneNumber: sanitizedPhone,
            solanaAddress: wallet.address,
            privyWalletId: wallet.id,
            countryCode,
        });

        // Fire-and-forget SOL funding (does not block response)

        logger.info(`User registered with Solana wallet: ${wallet.address}`);
        res.status(201).json(result);
    } catch (error) {
        logger.error("Create User Error", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const pregenerateWallet = async (req: Request, res: Response) => {
    try {
        const { phoneNumber } = req.body;
        const validatedData = pregenerateWalletSchema.safeParse(req.body);
        if (!validatedData.success) {
            return res.status(400).json({ message: "Invalid input", errors: validatedData.error.errors });
        }

        const sanitizedPhone = phoneNumber.replace(/[\s-]/g, "");

        // Return existing record if phone already has a wallet
        const existing = await userService.getUserByPhone(sanitizedPhone);
        if (existing) {
            return res.status(200).json(existing);
        }

        // Create a Privy server wallet for this unregistered recipient
        const wallet = await privy.wallets().create({ chain_type: 'solana' });

        const result = await userService.createUser({
            privyDID: `pregenerated:${sanitizedPhone}`,
            phoneNumber: sanitizedPhone,
            solanaAddress: wallet.address,
            privyWalletId: wallet.id,
            countryCode: sanitizedPhone.slice(0, 3),
        });

        // Fire-and-forget SOL seed

        res.status(200).json(result);
    } catch (error) {
        logger.error("Pregenerate Wallet Error", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const validatedId = privyDIDSchema.safeParse({ id });
        if (!validatedId.success) {
            return res.status(400).json({ message: "Invalid ID format", errors: validatedId.error.errors });
        }
        const user = await userService.getUserById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        logger.error("Get User Error", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUserByPhone = async (req: Request, res: Response) => {
    try {
        const { phoneNumber } = req.params;
        const validatedPhone = phoneNumberSchema.safeParse({ phoneNumber: phoneNumber });
        if (!validatedPhone.success) {
            return res.status(400).json({ message: "Invalid phone number format", errors: validatedPhone.error.errors });
        }
        const sanitizedPhoneNumber = phoneNumber.replace(/[\s-]/g, "");
        logger.logPhoneOperation("Looking up user by phone", phoneNumber);
        const user = await userService.getUserByPhone(sanitizedPhoneNumber);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        logger.error("Get User By Phone Error", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUserByWallet = async (req: Request, res: Response) => {
    try {
        const { walletAddress } = req.params;
        const validatedWallet = walletAddressSchema.safeParse({ address: walletAddress });
        if (!validatedWallet.success) {
            return res.status(400).json({ message: "Invalid wallet address format", errors: validatedWallet.error.errors });
        }
        const user = await userService.getUserBySolanaAddress(walletAddress);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        logger.error("Get User By Wallet Error", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUserBalance = async (req: Request, res: Response): Promise<void> => {
    try {
        const { privyDID } = req.params;
        const user = await userService.getUserById(privyDID);

        if (!user || !(user as any).solanaAddress) {
            res.status(404).json({ message: "User wallet not found" });
            return;
        }

        const balance = await getUsdcBalance((user as any).solanaAddress);
        res.status(200).json({ balance });
    } catch (error) {
        logger.error("Get Balance Error", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData: UpdateUserInput = req.body;

        const validatedUpdateData = updateUserSchema.safeParse({ id, ...updateData });
        if (!validatedUpdateData.success) {
            return res.status(400).json({ message: "Invalid input", errors: validatedUpdateData.error.errors });
        }

        const existingUser = await userService.getUserById(id);
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const updatedUser = await userService.updateUser(id, updateData);
        res.status(200).json(updatedUser);
    } catch (error) {
        logger.error("Update User Error", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const validatedId = idRequestSchema.safeParse({ id });
        if (!validatedId.success) {
            return res.status(400).json({ message: "Invalid ID format", errors: validatedId.error.errors });
        }

        const existingUser = await userService.getUserById(id);
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }

        await userService.deleteUser(id);
        res.status(204).send();
    } catch (error) {
        logger.error("Delete User Error", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await userService.getAllUsers();
        return res.status(200).json(users);
    } catch (error) {
        logger.error("Get All Users Error", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUserTransactionSummary = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const validatedId = idRequestSchema.safeParse({ id: userId });
        if (!validatedId.success) {
            res.status(400).json({ message: "Invalid ID format", errors: validatedId.error.errors });
            return;
        }

        const existingUser = await userService.getUserById(userId);
        if (!existingUser) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        const summary = await userService.getUserTransactionSummary(userId);
        res.status(200).json(summary);
    } catch (error) {
        logger.error("Get Transaction Summary Error", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUserTransactionSummaryController = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const validatedId = idRequestSchema.safeParse({ id: userId });
        if (!validatedId.success) {
            res.status(400).json({ message: "Invalid ID format", errors: validatedId.error.errors });
            return;
        }

        const user = await userService.getUserById(userId);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }

        const summary = await userService.getUserTransactionSummary(userId);
        res.status(200).json({ success: true, data: summary });
    } catch (error) {
        logger.error("Transaction Summary Error", error);
        res.status(500).json({
            message: "Error fetching transaction summary",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
