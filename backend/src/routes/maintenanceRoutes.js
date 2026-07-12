const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', auth, async (req, res) => {
  try {
    const { vehicleId, status } = req.query;
    const where = {};
    if (vehicleId) where.vehicleId = +vehicleId;
    if (status) where.status = status;
    const logs = await prisma.maintenanceLog.findMany({
      where, include: { vehicle: true }, orderBy: { startDate: 'desc' }
    });
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST — creating a maintenance log sets vehicle to IN_SHOP
router.post('/', auth, async (req, res) => {
  try {
    const { vehicleId, type, description, cost } = req.body;

    const vehicle = await prisma.vehicle.findUnique({ where: { id: +vehicleId } });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    if (vehicle.status === 'RETIRED') return res.status(400).json({ error: 'Cannot create maintenance for a retired vehicle' });
    if (vehicle.status === 'ON_TRIP') return res.status(400).json({ error: 'Vehicle is currently on a trip' });

    const [log] = await prisma.$transaction([
      prisma.maintenanceLog.create({
        data: { vehicleId: +vehicleId, type, description, cost: +(cost || 0), status: 'ACTIVE' },
        include: { vehicle: true }
      }),
      prisma.vehicle.update({ where: { id: +vehicleId }, data: { status: 'IN_SHOP' } }),
    ]);

    res.status(201).json(log);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /:id/close — closing restores vehicle to AVAILABLE (unless retired)
router.patch('/:id/close', auth, async (req, res) => {
  try {
    const log = await prisma.maintenanceLog.findUnique({
      where: { id: +req.params.id }, include: { vehicle: true }
    });
    if (!log) return res.status(404).json({ error: 'Maintenance log not found' });
    if (log.status === 'CLOSED') return res.status(400).json({ error: 'Already closed' });

    const vehicleStatus = log.vehicle.status === 'RETIRED' ? 'RETIRED' : 'AVAILABLE';

    const [updated] = await prisma.$transaction([
      prisma.maintenanceLog.update({
        where: { id: +req.params.id },
        data: { status: 'CLOSED', endDate: new Date(), cost: req.body.cost != null ? +req.body.cost : log.cost },
        include: { vehicle: true }
      }),
      prisma.vehicle.update({ where: { id: log.vehicleId }, data: { status: vehicleStatus } }),
    ]);

    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.maintenanceLog.delete({ where: { id: +req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
