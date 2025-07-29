import { Request, Response } from 'express';
import { userService } from "../../db/services/userService";
import { CreateUserInput, UpdateUserInput } from "../../types";
import { privy } from '../../services/privy';
import { createUserSchema, idRequestSchema, phoneNumberSchema, pregenerateWalletSchema, updateUserSchema, walletAddressSchema } from '../../schemas';
import { logger } from '../../utils/logger';

export const createUser = async (req: Request, res: Response) => {
    try {
        const userData: CreateUserInput = req.body;

        if (!userData.privyDID || !userData.phoneNumber || !userData.walletAddress) {
            return res.status(400).json({ message: "Phone number and wallet address are required" });
        }

        const validatedUserData = createUserSchema.safeParse(userData);
        if (!validatedUserData.success) {
            return res.status(400).json({ message: "Invalid input", errors: validatedUserData.error.errors });
        }

        //sanitize phone number
        logger.logUserAction("Processing user registration", userData.privyDID, {
            hasPhoneNumber: !!userData.phoneNumber,
            hasWalletAddress: !!userData.walletAddress
        });
        const countryCode = userData.phoneNumber.split(" ")[0];
        userData.phoneNumber = userData.phoneNumber.replace(/[\s-]/g, "");
        logger.info("Phone number sanitized successfully");
        // Check if the user already exists
        const existingUserByPhone = await userService.getUserByPhone(userData.phoneNumber);
        if (existingUserByPhone) {
            return res.status(409).json({ message: "User with this phone number already exists" });
        }

        const existingUser = await userService.getUserByWallet(userData.walletAddress);
        if (existingUser) {
            return res.status(409).json({ message: "User with this wallet address already exists" });
        }

        const completeData = {
            ...userData,
            status: "ACTIVE",
            countryCode: countryCode,
        }

        const result = await userService.createUser(completeData);
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

        if (!phoneNumber) {
            return res.status(400).json({ message: "Phone number is required" });
        }

        const user = await privy.importUser({
            linkedAccounts: [
                {
                    type: "phone",
                    number: phoneNumber
                }
            ],
            createEthereumWallet: true,
        });
        const walletAddress = user.wallet?.address;
        const result = await userService.createUser({
            privyDID: user.id,
            phoneNumber: user.phone?.number || "",
            walletAddress: walletAddress || "",
            countryCode: user.phone?.number.split(" ")[0] || "",
        })
        res.status(200).json(result);
    } catch (error) {
        logger.error("Pregenerate Wallet Error", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const validatedId = idRequestSchema.safeParse({ id });
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
        if (!phoneNumber) {
            return res.status(400).json({ message: "Phone number is required" });
        }
        // Check if phone number has spaces or dashes
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
        const user = await userService.getUserByWallet(walletAddress);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Get User By Wallet Error:", error);
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
        console.error("Update User Error:", error);
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
        console.error("Delete User Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await userService.getAllUsers();
        return res.status(200).json(users);
    } catch (error) {
        console.error("Get All Users Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUserTransactionSummary = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const validatedId = idRequestSchema.safeParse({ id: userId });
        if (!validatedId.success) {
            res.status(400).json({ message: "Invalid ID format", errors: validatedId.error.errors });
            return
        }

        const existingUser = await userService.getUserById(userId);
        if (!existingUser) {
            res.status(404).json({ message: "User not found" });
            return
        }

        const summary = await userService.getUserTransactionSummary(userId);
        res.status(200).json(summary);
    } catch (error) {
        console.error("Get Transaction Summary Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUserTransactionSummaryController = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const validatedId = idRequestSchema.safeParse({ id: userId });
        if (!validatedId.success) {
            res.status(400).json({ message: "Invalid ID format", errors: validatedId.error.errors });
            return
        }

        // Validate user exists
        const user = await userService.getUserById(userId);
        if (!user) {
            res.status(404).json({
                message: "User not found"
            });
            return;
        }

        // Get transaction summary
        const summary = await userService.getUserTransactionSummary(userId);

        res.status(200).json({
            success: true,
            data: summary
        });
        return;

    } catch (error) {
        console.error('Transaction Summary Error:', error);
        res.status(500).json({
            message: "Error fetching transaction summary",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        return
    }
};