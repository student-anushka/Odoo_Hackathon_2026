const express = require("express");
const prisma = require("../prisma");

const router = express.Router();

// GET /analytics/operational-cost
// Per-vehicle: sum(fuelLogs.totalCost) + sum(maintenanceLogs.cost)
router.get("/operational-cost", async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany();

    const fuelByVehicle = await prisma.fuelLog.groupBy({
      by: ["vehicleId"],
      _sum: { totalCost: true },
    });
    const maintByVehicle = await prisma.maintenanceLog.groupBy({
      by: ["vehicleId"],
      _sum: { cost: true },
    });
    const expenseByVehicle = await prisma.expense.groupBy({
      by: ["vehicleId"],
      _sum: { amount: true },
    });

    const fuelMap = Object.fromEntries(
      fuelByVehicle.map((f) => [f.vehicleId, f._sum.totalCost || 0])
    );
    const maintMap = Object.fromEntries(
      maintByVehicle.map((m) => [m.vehicleId, m._sum.cost || 0])
    );
    const expenseMap = Object.fromEntries(
      expenseByVehicle.map((e) => [e.vehicleId, e._sum.amount || 0])
    );

    const result = vehicles.map((v) => {
      const fuelCost = fuelMap[v.id] || 0;
      const maintenanceCost = maintMap[v.id] || 0;
      const otherExpenses = expenseMap[v.id] || 0;
      return {
        vehicleId: v.id,
        registrationNumber: v.registrationNumber,
        name: v.name,
        fuelCost,
        maintenanceCost,
        otherExpenses,
        totalOperationalCost: fuelCost + maintenanceCost + otherExpenses,
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compute operational cost" });
  }
});

// GET /analytics/fuel-efficiency
// Per completed trip: distance / fuel (km per liter), grouped by vehicle,
// ordered by date so the frontend can plot a trend line over time.
router.get("/fuel-efficiency", async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      where: {
        status: "COMPLETED",
        actualDistance: { not: null },
        fuelConsumed: { not: null },
      },
      include: { vehicle: true },
      orderBy: { completedAt: "asc" },
    });

    const result = trips
      .filter((t) => t.fuelConsumed && t.fuelConsumed > 0)
      .map((t) => ({
        tripId: t.id,
        vehicleId: t.vehicleId,
        registrationNumber: t.vehicle.registrationNumber,
        date: t.completedAt,
        distance: t.actualDistance,
        fuelConsumed: t.fuelConsumed,
        efficiency: Number((t.actualDistance / t.fuelConsumed).toFixed(2)),
      }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compute fuel efficiency" });
  }
});

// GET /analytics/fleet-status
// Count of vehicles per status, for the fleet status pie chart.
router.get("/fleet-status", async (req, res) => {
  try {
    const grouped = await prisma.vehicle.groupBy({
      by: ["status"],
      _count: { status: true },
    });
    const result = grouped.map((g) => ({
      status: g.status,
      count: g._count.status,
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compute fleet status" });
  }
});

// GET /analytics/roi
// ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
// NOTE: `revenue` is a per-vehicle field seeded/entered as an assumption
// since the brief does not define where revenue comes from.
router.get("/roi", async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany();

    const fuelByVehicle = await prisma.fuelLog.groupBy({
      by: ["vehicleId"],
      _sum: { totalCost: true },
    });
    const maintByVehicle = await prisma.maintenanceLog.groupBy({
      by: ["vehicleId"],
      _sum: { cost: true },
    });

    const fuelMap = Object.fromEntries(
      fuelByVehicle.map((f) => [f.vehicleId, f._sum.totalCost || 0])
    );
    const maintMap = Object.fromEntries(
      maintByVehicle.map((m) => [m.vehicleId, m._sum.cost || 0])
    );

    const result = vehicles.map((v) => {
      const fuelCost = fuelMap[v.id] || 0;
      const maintenanceCost = maintMap[v.id] || 0;
      const roi =
        v.acquisitionCost > 0
          ? (v.revenue - (maintenanceCost + fuelCost)) / v.acquisitionCost
          : 0;
      return {
        vehicleId: v.id,
        registrationNumber: v.registrationNumber,
        name: v.name,
        revenue: v.revenue,
        fuelCost,
        maintenanceCost,
        acquisitionCost: v.acquisitionCost,
        roi: Number(roi.toFixed(4)),
      };
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to compute ROI" });
  }
});

module.exports = router;
