const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Fuel logs
router.get('/logs', auth, async (req, res) => {
  try {
    const { vehicleId } = req.query;
    const where = vehicleId ? { vehicleId: +vehicleId } : {};
    const logs = await prisma.fuelLog.findMany({ where, include: { vehicle: true }, orderBy: { date: 'desc' } });
    res.json(logs);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/logs', auth, async (req, res) => {
  try {
    const log = await prisma.fuelLog.create({
      data: { ...req.body, vehicleId: +req.body.vehicleId, liters: +req.body.liters, cost: +req.body.cost, date: new Date(req.body.date || Date.now()) },
      include: { vehicle: true }
    });
    res.status(201).json(log);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Expenses
router.get('/expenses', auth, async (req, res) => {
  try {
    const { vehicleId } = req.query;
    const where = vehicleId ? { vehicleId: +vehicleId } : {};
    const expenses = await prisma.expense.findMany({ where, include: { vehicle: true }, orderBy: { date: 'desc' } });
    res.json(expenses);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/expenses', auth, async (req, res) => {
  try {
    const expense = await prisma.expense.create({
      data: { ...req.body, vehicleId: +req.body.vehicleId, amount: +req.body.amount, date: new Date(req.body.date || Date.now()) },
      include: { vehicle: true }
    });
    res.status(201).json(expense);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

module.exports = router;
