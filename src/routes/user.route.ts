import { Router } from "express";
import { createUser, pregenerateWallet, getUserById, getUserByPhone, getUserByWallet, updateUser } from "../controllers/users/user.controller";

const router = Router();

router.post("/register", async (req, res) => {
    try {
        const data = req.body;
        await createUser(req, res);
        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
router.post("/pregenerate", async (req, res) => {
    try {
        await pregenerateWallet(req, res);
        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
router.put("/update/:id", async (req, res) => {
    try {
        await updateUser(req, res);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
router.get("/get/:id", async (req, res) => {
    try {
        await getUserById(req, res);
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
router.get("/phone/:phoneNumber", async (req, res) => {
    try {
        await getUserByPhone(req, res);
    } catch (error) {
        console.error("Error fetching user by phone:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
router.get("/wallet/:id", async (req, res) => {
    try {
        await getUserByWallet(req, res);
    } catch (error) {
        console.error("Error fetching user by wallet:", error);
        res.status(500).json({ message: "Internal server error" });

    }
});

export default router;