import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/admin-overview.controller.js";
const router = Router();
router.get("/admin/overview", controller.getAdminOverview);
export default router;
