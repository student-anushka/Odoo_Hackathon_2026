const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ── POST /api/trips ────────────────────────────────────────────────────────────
// Business rules: vehicle AVAILABLE, driver AVAILABLE, license not expired,
// cargoWeight ≤ maxLoad
router.post('/', auth, async (req, res) => {
  try {
    const { source, destination, vehicleId, driverId, cargoWeightKg, plannedDistKm, revenue } = req.body;

    // Fetch vehicle + driver in parallel
    const [vehicle, driver] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: +vehicleId } }),
      prisma.driver.findUnique({ where: { id: +driverId } }),
    ]);

    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (!driver)  return res.status(404).json({ error: 'Driver not found' });

    // Rule: vehicle must be AVAILABLE
    if (vehicle.status !== 'AVAILABLE') {
      return res.status(400).json({
        error: `Vehicle is not available (current status: ${vehicle.status})`,
        field: 'vehicleId',
      });
    }

    // Rule: driver must be AVAILABLE
    if (driver.status !== 'AVAILABLE') {
      return res.status(400).json({
        error: `Driver is not available (current status: ${driver.status})`,
        field: 'driverId',
      });
    }

    // Rule: driver must not be SUSPENDED
    if (driver.status === 'SUSPENDED') {
      return res.status(400).json({ error: 'Driver is suspended and cannot be assigned', field: 'driverId' });
    }

    // Rule: license must not be expired
    if (new Date(driver.licenseExpiry) <= new Date()) {
      return res.status(400).json({
        error: `Driver's license expired on ${new Date(driver.licenseExpiry).toLocaleDateString()}`,
        field: 'driverId',
      });
    }

    // Rule: cargo weight must not exceed vehicle max load
    if (+cargoWeightKg > vehicle.maxLoadKg) {
      return res.status(400).json({
        error: `Cargo weight (${cargoWeightKg} kg) exceeds vehicle max load (${vehicle.maxLoadKg} kg)`,
        field: 'cargoWeightKg',
      });
    }

    const trip = await prisma.trip.create({
      data: {
        source, destination,
        vehicleId: +vehicleId,
        driverId: +driverId,
        cargoWeightKg: +cargoWeightKg,
        plannedDistKm: +plannedDistKm,
        revenue: +(revenue || 0),
        status: 'DRAFT',
      },
      include: { vehicle: true, driver: true },
    });

    res.status(201).json(trip);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/trips ─────────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { status, vehicleId, driverId, from, to, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status)    where.status    = status;
    if (vehicleId) where.vehicleId = +vehicleId;
    if (driverId)  where.driverId  = +driverId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to)   where.createdAt.lte = new Date(to);
    }

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        include: { vehicle: true, driver: true },
        orderBy: { createdAt: 'desc' },
        skip: (+page - 1) * +limit,
        take: +limit,
      }),
      prisma.trip.count({ where }),
    ]);

    res.json({ trips, total, page: +page, limit: +limit, pages: Math.ceil(total / +limit) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── GET /api/trips/:id ─────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: +req.params.id },
      include: { vehicle: true, driver: true },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PATCH /api/trips/:id/dispatch ──────────────────────────────────────────────
// Atomic: trip → DISPATCHED, vehicle → ON_TRIP, driver → ON_TRIP
router.patch('/:id/dispatch', auth, async (req, res) => {
  try {
    const tripId = +req.params.id;
    const existing = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });

    if (!existing) return res.status(404).json({ error: 'Trip not found' });
    if (existing.status !== 'DRAFT') {
      return res.status(400).json({ error: `Trip cannot be dispatched (status: ${existing.status})` });
    }

    // Re-validate at dispatch time (state may have changed since creation)
    if (existing.vehicle.status !== 'AVAILABLE') {
      return res.status(400).json({ error: `Vehicle is no longer available (${existing.vehicle.status})` });
    }
    if (existing.driver.status !== 'AVAILABLE') {
      return res.status(400).json({ error: `Driver is no longer available (${existing.driver.status})` });
    }
    if (new Date(existing.driver.licenseExpiry) <= new Date()) {
      return res.status(400).json({ error: "Driver's license has expired" });
    }

    // Atomic transaction — all 3 or none
    const [trip] = await prisma.$transaction([
      prisma.trip.update({
        where: { id: tripId },
        data: { status: 'DISPATCHED', dispatchedAt: new Date() },
        include: { vehicle: true, driver: true },
      }),
      prisma.vehicle.update({ where: { id: existing.vehicleId }, data: { status: 'ON_TRIP' } }),
      prisma.driver.update({ where: { id: existing.driverId }, data: { status: 'ON_TRIP' } }),
    ]);

    res.json(trip);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PATCH /api/trips/:id/complete ──────────────────────────────────────────────
// Accepts endOdometer + fuelConsumed; creates fuel log; restores statuses
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const tripId = +req.params.id;
    const { endOdometerKm, fuelConsumedL } = req.body;

    const existing = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });

    if (!existing) return res.status(404).json({ error: 'Trip not found' });
    if (existing.status !== 'DISPATCHED') {
      return res.status(400).json({ error: `Only dispatched trips can be completed (status: ${existing.status})` });
    }

    const ops = [
      prisma.trip.update({
        where: { id: tripId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          endOdometerKm: endOdometerKm ? +endOdometerKm : undefined,
          fuelConsumedL: fuelConsumedL ? +fuelConsumedL : undefined,
        },
        include: { vehicle: true, driver: true },
      }),
      prisma.vehicle.update({
        where: { id: existing.vehicleId },
        data: {
          status: 'AVAILABLE',
          ...(endOdometerKm ? { odometerKm: +endOdometerKm } : {}),
        },
      }),
      prisma.driver.update({ where: { id: existing.driverId }, data: { status: 'AVAILABLE' } }),
    ];

    // Auto-create fuel log if fuel consumed provided
    if (fuelConsumedL && +fuelConsumedL > 0) {
      ops.push(
        prisma.fuelLog.create({
          data: {
            vehicleId: existing.vehicleId,
            liters: +fuelConsumedL,
            cost: 0, // cost can be updated separately
            date: new Date(),
          },
        })
      );
    }

    const [trip] = await prisma.$transaction(ops);
    res.json(trip);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PATCH /api/trips/:id/cancel ────────────────────────────────────────────────
// Restores vehicle + driver to AVAILABLE; no odometer update
router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const tripId = +req.params.id;
    const existing = await prisma.trip.findUnique({
      where: { id: tripId },
      include: { vehicle: true, driver: true },
    });

    if (!existing) return res.status(404).json({ error: 'Trip not found' });
    if (!['DRAFT', 'DISPATCHED'].includes(existing.status)) {
      return res.status(400).json({ error: `Trip cannot be cancelled (status: ${existing.status})` });
    }

    const ops = [
      prisma.trip.update({
        where: { id: tripId },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
        include: { vehicle: true, driver: true },
      }),
    ];

    // Only restore statuses if trip was dispatched (DRAFT hasn't locked them)
    if (existing.status === 'DISPATCHED') {
      ops.push(
        prisma.vehicle.update({ where: { id: existing.vehicleId }, data: { status: 'AVAILABLE' } }),
        prisma.driver.update({ where: { id: existing.driverId }, data: { status: 'AVAILABLE' } })
      );
    }

    const [trip] = await prisma.$transaction(ops);
    res.json(trip);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
