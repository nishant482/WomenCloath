import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/settings.controller.js";
const router = Router();
router.get("/settings", controller.getSettings);
export default router;
