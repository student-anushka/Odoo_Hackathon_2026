const express = require("express");
const prisma = require("../prisma");

const router = express.Router();

// POST /fuel-logs
router.post("/", async (req, res) => {
  try {
    const { vehicleId, tripId, liters, costPerLiter, date } = req.body;

    if (!vehicleId || liters == null || costPerLiter == null) {
      return res
        .status(400)
        .json({ error: "vehicleId, liters and costPerLiter are required" });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

    const totalCost = Number(liters) * Number(costPerLiter);

    const log = await prisma.fuelLog.create({
      data: {
        vehicleId,
        tripId: tripId || null,
        liters: Number(liters),
        costPerLiter: Number(costPerLiter),
        totalCost,
        date: date ? new Date(date) : new Date(),
      },
    });

    res.status(201).json(log);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create fuel log" });
  }
});

// GET /fuel-logs?vehicleId=
router.get("/", async (req, res) => {
  try {
    const { vehicleId } = req.query;
    const logs = await prisma.fuelLog.findMany({
      where: vehicleId ? { vehicleId } : undefined,
      include: { vehicle: true },
      orderBy: { date: "desc" },
    });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch fuel logs" });
  }
});

module.exports = router;
