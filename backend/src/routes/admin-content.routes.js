import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/admin-content.controller.js";
const router = Router();
router.get("/admin/content", controller.getAdminContent);
router.post("/admin/content", controller.postAdminContent);
router.put("/admin/content/:id", controller.putAdminContentById);
router.delete("/admin/content/:id", controller.deleteAdminContentById);
export default router;
