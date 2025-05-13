import { Router } from "express";
import { requestMoney, cancelRequest, getPendingRequests, getRequestById, getUserRequests, updateRequestStatus } from "../controllers/request/request.controller";

const router = Router();
// POST /api/request-money
router.post("/", requestMoney);
router.get("/get/:id", getRequestById);
router.post("/cancel/:requestId", cancelRequest);
router.get("/get/all/:userId", getUserRequests);
router.get("/pending/:userId", getPendingRequests);
// update route
router.put("/update-status/:requestId", updateRequestStatus);

export default router;