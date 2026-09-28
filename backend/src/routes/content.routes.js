import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/content.controller.js";
const router = Router();
router.get("/content", controller.getContent);
export default router;
