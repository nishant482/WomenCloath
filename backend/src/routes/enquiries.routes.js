import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/enquiries.controller.js";
const router = Router();
router.post("/enquiries", controller.postEnquiries);
export default router;
