import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/admin-uploads.controller.js";
const router = Router();
router.post("/admin/uploads", controller.postAdminUploads);
export default router;
