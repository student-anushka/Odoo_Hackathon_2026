const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/vehicles
router.get('/', auth, async (req, res) => {
  try {
    const { status, type, region } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (region) where.region = region;
    const vehicles = await prisma.vehicle.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(vehicles);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/vehicles/available — only AVAILABLE vehicles for dispatch
router.get('/available', auth, async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({ where: { status: 'AVAILABLE' } });
    res.json(vehicles);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/vehicles
router.post('/', auth, async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.create({ data: req.body });
    res.status(201).json(vehicle);
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Registration number already exists' });
    res.status(400).json({ error: e.message });
  }
});

// PUT /api/vehicles/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.update({ where: { id: +req.params.id }, data: req.body });
    res.json(vehicle);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// DELETE /api/vehicles/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.vehicle.delete({ where: { id: +req.params.id } });
    res.json({ message: 'Vehicle deleted' });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
