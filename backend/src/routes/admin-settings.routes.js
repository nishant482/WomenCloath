import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/admin-settings.controller.js";
const router = Router();
router.get("/admin/settings", controller.getAdminSettings);
router.put("/admin/settings", controller.putAdminSettings);
router.patch("/admin/settings", controller.patchAdminSettings);
export default router;
