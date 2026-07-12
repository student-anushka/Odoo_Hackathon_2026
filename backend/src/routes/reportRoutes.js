const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reports/dashboard — KPIs
router.get('/dashboard', auth, async (req, res) => {
  try {
    const [
      activeVehicles, availableVehicles, inShopVehicles, totalVehicles,
      activeTrips, pendingTrips, driversOnDuty, totalDrivers
    ] = await Promise.all([
      prisma.vehicle.count({ where: { status: { not: 'RETIRED' } } }),
      prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
      prisma.vehicle.count({ where: { status: 'IN_SHOP' } }),
      prisma.vehicle.count(),
      prisma.trip.count({ where: { status: 'DISPATCHED' } }),
      prisma.trip.count({ where: { status: 'DRAFT' } }),
      prisma.driver.count({ where: { status: 'ON_TRIP' } }),
      prisma.driver.count({ where: { status: { not: 'SUSPENDED' } } }),
    ]);

    const fleetUtilization = activeVehicles > 0
      ? Math.round((activeTrips / activeVehicles) * 100)
      : 0;

    res.json({
      activeVehicles, availableVehicles, inShopVehicles, totalVehicles,
      activeTrips, pendingTrips, driversOnDuty, totalDrivers,
      fleetUtilization,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/reports/analytics — fuel efficiency, costs, ROI per vehicle
router.get('/analytics', auth, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        trips: { where: { status: 'COMPLETED' } },
        maintenanceLogs: true,
        fuelLogs: true,
        expenses: true,
      }
    });

    const analytics = vehicles.map(v => {
      const totalFuelL = v.fuelLogs.reduce((s, f) => s + f.liters, 0);
      const totalFuelCost = v.fuelLogs.reduce((s, f) => s + f.cost, 0);
      const totalMaintCost = v.maintenanceLogs.reduce((s, m) => s + m.cost, 0);
      const totalExpenses = v.expenses.reduce((s, e) => s + e.amount, 0);
      const totalDistKm = v.trips.reduce((s, t) => s + (t.plannedDistKm || 0), 0);
      const totalRevenue = v.trips.reduce((s, t) => s + (t.revenue || 0), 0);
      const operationalCost = totalFuelCost + totalMaintCost + totalExpenses;
      const fuelEfficiency = totalFuelL > 0 ? (totalDistKm / totalFuelL).toFixed(2) : null;
      const roi = v.acquisitionCost > 0
        ? (((totalRevenue - operationalCost) / v.acquisitionCost) * 100).toFixed(2)
        : null;

      return {
        vehicleId: v.id,
        regNumber: v.regNumber,
        name: v.name,
        type: v.type,
        status: v.status,
        totalFuelL: totalFuelL.toFixed(2),
        totalFuelCost: totalFuelCost.toFixed(2),
        totalMaintCost: totalMaintCost.toFixed(2),
        operationalCost: operationalCost.toFixed(2),
        totalDistKm: totalDistKm.toFixed(2),
        totalRevenue: totalRevenue.toFixed(2),
        fuelEfficiency,
        roi,
        tripsCompleted: v.trips.length,
      };
    });

    res.json(analytics);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/reports/expiring-licenses — drivers expiring within 30 days
router.get('/expiring-licenses', auth, async (req, res) => {
  try {
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const drivers = await prisma.driver.findMany({
      where: { licenseExpiry: { lte: in30Days } },
      orderBy: { licenseExpiry: 'asc' }
    });
    res.json(drivers);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
