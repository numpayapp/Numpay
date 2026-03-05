import { Router } from "express";
import { createUser, pregenerateWallet, getUserById, getUserByPhone, getUserByWallet, getUserBalance, updateUser, getUserTransactionSummary, getUserTransactionSummaryController } from "../controllers/users/user.controller";
import { authenticateUser } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", async (req, res) => {
    try {
        await createUser(req, res);
    } catch (error) {
        console.error("Error creating user:", error);
    }
});
router.post("/pregenerate", async (req, res) => {
    try {
        await pregenerateWallet(req, res);
    } catch (error) {
        console.error("Error creating user:", error);
    }
});
router.put("/update/:id", authenticateUser, async (req, res) => {
    try {
        await updateUser(req, res);
    } catch (error) {
        console.error("Error updating user:", error);
    }
});
router.get("/get/:id", authenticateUser, async (req, res) => {
    try {
        await getUserById(req, res);
    } catch (error) {
        console.error("Error fetching user:", error);
    }
});
router.get("/phone/:phoneNumber", authenticateUser, async (req, res) => {
    try {
        await getUserByPhone(req, res);
    } catch (error) {
        console.error("Error fetching user by phone:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
router.get("/wallet/:id", authenticateUser, async (req, res) => {
    try {
        await getUserByWallet(req, res);
    } catch (error) {
        console.error("Error fetching user by wallet:", error);
        res.status(500).json({ message: "Internal server error" });

    }
});

// USDC balance for a user (by privyDID)
router.get("/balance/:privyDID", authenticateUser, getUserBalance);

router.get("transaction-summary/:userId/", authenticateUser, getUserTransactionSummary);

// Transaction summary route
router.get("/:userId/summary", authenticateUser, getUserTransactionSummaryController);

export default router;