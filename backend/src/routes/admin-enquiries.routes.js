import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/admin-enquiries.controller.js";
const router = Router();
router.get("/admin/enquiries", controller.getAdminEnquiries);
router.patch("/admin/enquiries/:id", controller.patchAdminEnquiriesById);
export default router;
