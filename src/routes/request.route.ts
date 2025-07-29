import { Router } from "express";
import { requestMoney, cancelRequest, getPendingRequests, getRequestById, getUserRequests, updateRequestStatus, requestMoneyGlobal } from "../controllers/request/request.controller";
import { authenticateUser } from "../middleware/auth.middleware";

const router = Router();
// POST /api/request-money
router.post("/", authenticateUser, requestMoney);
router.post("/global", authenticateUser, requestMoneyGlobal);
router.get("/get/:id", authenticateUser, getRequestById);
router.post("/cancel/:requestId", authenticateUser, cancelRequest);
router.get("/get/all/:userId", authenticateUser, getUserRequests);
router.get("/pending/:userId", authenticateUser, getPendingRequests);
// update route
router.put("/update-status/:requestId", authenticateUser, updateRequestStatus);

export default router;