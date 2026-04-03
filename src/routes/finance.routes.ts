import { Router } from "express";
import { financeController } from "../controllers/finance.controller";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth.middleware";
import { RateLimiter } from "../middlewares/RateLimiter";

const router = Router();

const financeRateLimiter = new RateLimiter("finance_req");
router.use(financeRateLimiter.limit);

router.use(isAuthenticated);

router.get("/dashboard", authorizeRoles("ADMIN", "ANALYST", "VIEWER"), financeController.getDashboardSummary.bind(financeController));

router.post(
  "/", 
  authorizeRoles("ADMIN"), 
  financeController.createRecord.bind(financeController)
);

router.get(
  "/", 
  authorizeRoles("ADMIN", "ANALYST"), 
  financeController.getRecords.bind(financeController)
);

router.put(
  "/:id", 
  authorizeRoles("ADMIN"), 
  financeController.updateRecord.bind(financeController)
);

router.delete(
  "/:id", 
  authorizeRoles("ADMIN"), 
  financeController.deleteRecord.bind(financeController)
);

export default router;
