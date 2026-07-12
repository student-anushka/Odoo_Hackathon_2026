const express = require("express");
const prisma = require("../prisma");

const router = express.Router();

const VALID_TYPES = ["TOLL", "MAINTENANCE", "MISC"];

// POST /expenses
router.post("/", async (req, res) => {
  try {
    const { vehicleId, type, amount, description, date } = req.body;

    if (!vehicleId || !type || amount == null) {
      return res
        .status(400)
        .json({ error: "vehicleId, type and amount are required" });
    }
    if (!VALID_TYPES.includes(type)) {
      return res
        .status(400)
        .json({ error: `type must be one of ${VALID_TYPES.join(", ")}` });
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });

    const expense = await prisma.expense.create({
      data: {
        vehicleId,
        type,
        amount: Number(amount),
        description: description || null,
        date: date ? new Date(date) : new Date(),
      },
    });

    res.status(201).json(expense);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create expense" });
  }
});

// GET /expenses?vehicleId=
router.get("/", async (req, res) => {
  try {
    const { vehicleId } = req.query;
    const expenses = await prisma.expense.findMany({
      where: vehicleId ? { vehicleId } : undefined,
      include: { vehicle: true },
      orderBy: { date: "desc" },
    });
    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

module.exports = router;
