import { Request, Response } from 'express';
import { userService } from "../../db/services/userService";
import { CreateUserInput, UpdateUserInput } from "../../types";

export const createUser = async (req: Request, res: Response) => {
    try {
        const userData: CreateUserInput = req.body;

        if (!userData.phoneNumber || !userData.walletAddress) {
            return res.status(400).json({ message: "Phone number and wallet address are required" });
        }

        const existingUser = await userService.getUserByWallet(userData.walletAddress);
        if (existingUser) {
            return res.status(409).json({ message: "User with this wallet address already exists" });
        }

        const result = await userService.createUser(userData);
        res.status(201).json(result);
    } catch (error) {
        console.error("Create User Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await userService.getUserById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Get User Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUserByWallet = async (req: Request, res: Response) => {
    try {
        const { walletAddress } = req.params;
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
        res.status(200).json(users);
    } catch (error) {
        console.error("Get All Users Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};