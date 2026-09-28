import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/health.controller.js";
const router = Router();
router.get("/health", controller.getHealth);
export default router;
