const express = require("express");
const prisma = require("../prisma");

const router = express.Router();

// POST /maintenance
// Creates a maintenance log and, in the same transaction, flips the
// vehicle's status to IN_SHOP (removing it from the driver's/dispatcher's
// selection pool per business rule 3.6).
router.post("/", async (req, res) => {
  try {
    const { vehicleId, type, description, cost } = req.body;

    if (!vehicleId || !type) {
      return res.status(400).json({ error: "vehicleId and type are required" });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    if (vehicle.status === "RETIRED") {
      return res.status(400).json({ error: "Cannot open maintenance on a retired vehicle" });
    }

    const [log] = await prisma.$transaction([
      prisma.maintenanceLog.create({
        data: {
          vehicleId,
          type,
          description: description || null,
          cost: cost ? Number(cost) : 0,
          status: "OPEN",
        },
      }),
      prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: "IN_SHOP" },
      }),
    ]);

    res.status(201).json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create maintenance log" });
  }
});

// PATCH /maintenance/:id/close
// Closes the maintenance log and restores the vehicle to AVAILABLE,
// unless the vehicle has since been marked RETIRED.
router.patch("/:id/close", async (req, res) => {
  try {
    const { id } = req.params;

    const log = await prisma.maintenanceLog.findUnique({ where: { id } });
    if (!log) return res.status(404).json({ error: "Maintenance log not found" });
    if (log.status === "CLOSED") {
      return res.status(400).json({ error: "Maintenance log already closed" });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: log.vehicleId } });

    const [updatedLog] = await prisma.$transaction([
      prisma.maintenanceLog.update({
        where: { id },
        data: { status: "CLOSED", closedAt: new Date() },
      }),
      prisma.vehicle.update({
        where: { id: log.vehicleId },
        data: {
          status: vehicle.status === "RETIRED" ? "RETIRED" : "AVAILABLE",
        },
      }),
    ]);

    res.json(updatedLog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to close maintenance log" });
  }
});

// GET /maintenance?vehicleId=
router.get("/", async (req, res) => {
  try {
    const { vehicleId } = req.query;
    const logs = await prisma.maintenanceLog.findMany({
      where: vehicleId ? { vehicleId } : undefined,
      include: { vehicle: true },
      orderBy: { openedAt: "desc" },
    });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch maintenance logs" });
  }
});

module.exports = router;
