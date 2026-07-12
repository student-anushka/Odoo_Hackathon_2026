const express = require("express");
const router = express.Router();
const { authMiddleware, roleGuard } = require("../middleware/auth");
const {
  createMaintenance,
  closeMaintenance,
  getMaintenanceLogs,
  getMaintenanceById,
} = require("./maintenance.controller");

router.use(authMiddleware);

router.get("/", getMaintenanceLogs);
router.get("/:id", getMaintenanceById);
router.post("/", roleGuard(["FLEET_MANAGER"]), createMaintenance);
router.patch("/:id/close", roleGuard(["FLEET_MANAGER"]), closeMaintenance);

module.exports = router;
