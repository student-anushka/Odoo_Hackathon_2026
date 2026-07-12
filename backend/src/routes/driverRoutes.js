const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const drivers = await prisma.driver.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(drivers);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/available', auth, async (req, res) => {
  try {
    const today = new Date();
    const drivers = await prisma.driver.findMany({
      where: { status: 'AVAILABLE', licenseExpiry: { gt: today } }
    });
    res.json(drivers);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const data = { ...req.body, licenseExpiry: new Date(req.body.licenseExpiry) };
    const driver = await prisma.driver.create({ data });
    res.status(201).json(driver);
  } catch (e) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'License number already exists' });
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const data = req.body.licenseExpiry
      ? { ...req.body, licenseExpiry: new Date(req.body.licenseExpiry) }
      : req.body;
    const driver = await prisma.driver.update({ where: { id: +req.params.id }, data });
    res.json(driver);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.driver.delete({ where: { id: +req.params.id } });
    res.json({ message: 'Driver deleted' });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
