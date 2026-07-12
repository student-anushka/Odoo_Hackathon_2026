const express = require("express");
const prisma = require("../prisma");

const router = express.Router();

// Read-only stub. In the full team app, Vehicle CRUD belongs to the
// Fleet Manager module (Person A). Kept minimal here just so Person D's
// Maintenance/Fuel/Expense forms have vehicles to pick from.
router.get("/", async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { registrationNumber: "asc" },
    });
    res.json(vehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch vehicles" });
  }
});

module.exports = router;
