import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/account.controller.js";
const router = Router();
router.patch("/account", authenticate, controller.patchAccount);
export default router;
