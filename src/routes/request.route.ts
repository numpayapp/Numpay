import { Router } from "express";
import { requestMoney } from "../controllers/request/request.controller";

const router = Router();
// POST /api/request-money
router.post("/", requestMoney);

export default router;