import { Router } from "express";
import { createUser, pregenerateWallet, getUserById, getUserByPhone, getUserByWallet, updateUser, getUserTransactionSummary } from "../controllers/users/user.controller";

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

router.get("transaction-summary/:userId/", getUserTransactionSummary);

// Sample Response for transaction summary
// {
//     "activities": [
//         {
//             "id": "tx1",
//             "type": "TRANSACTION",
//             "date": "2024-05-08T10:00:00Z",
//             "amount": 100,
//             "isOutgoing": true,
//             "sender": { "name": "John", "phoneNumber": "+1234" },
//             "receiver": { "name": "Jane", "phoneNumber": "+5678" }
//         },
//         {
//             "id": "req1",
//             "type": "REQUEST",
//             "date": "2024-05-08T09:00:00Z",
//             "amount": 50,
//             "isOutgoing": false,
//             "requester": { "name": "Jane", "phoneNumber": "+5678" }
//         }
//     ],
//         "summary": {
//         "totalSent": 500,
//             "totalReceived": 300,
//                 "netBalance": -200,
//                     "totalTransactions": 10,
//                         "totalRequests": 5
//     }
// }

// router.get("/wallet/balance/:address", async (req, res) => {
//     try {
//         const { address } = req.params;
//         const user = await getUserByWallet(req, res);
//         if (!user) {
//             return res.status(404).json({ message: "User not found" });
//         }
//         const balance = await userService.getWalletBalance(address);
//         res.status(200).json({ balance });
//     } catch (error) {
//         console.error("Error fetching wallet balance:", error);
//         res.status(500).json({ message: "Internal server error" });
//     }
// });

export default router;