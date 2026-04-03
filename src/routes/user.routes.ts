import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth.middleware";
import { RateLimiter } from "../middlewares/RateLimiter";

const router = Router();

const userRateLimiter = new RateLimiter("user_req");
router.use(userRateLimiter.limit);

router.use(isAuthenticated);
router.use(authorizeRoles("ADMIN"));

router.get("/", userController.getAllUsers.bind(userController));
router.put("/:id/role", userController.updateUserRole.bind(userController));
router.put("/:id/status", userController.updateUserStatus.bind(userController));

export default router;
