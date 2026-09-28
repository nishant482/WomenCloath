import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import * as controller from "../controllers/admin-users.controller.js";
const router = Router();
router.get("/admin/users", controller.getAdminUsers);
router.get("/admin/users/:id/shopping", controller.getAdminUserShopping);
router.patch("/admin/users/:id", controller.patchAdminUsersById);
router.delete("/admin/users/:id", controller.deleteAdminUsersById);
export default router;
