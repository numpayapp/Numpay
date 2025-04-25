import { Router } from "express";
import { createUser } from "../controllers/users/user.controller";

const router = Router();

router.post("/register", async (req, res) => {
    try {
        const data = req.body;
        await createUser(data);
        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
router.post("/login", (req, res) => { });
router.post("/logout", (req, res) => { });
router.post("/update", (req, res) => { });

export default router;