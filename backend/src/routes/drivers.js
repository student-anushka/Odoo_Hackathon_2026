const express = require("express");
const prisma = require("../prisma");

const router = express.Router();

// Read-only stub. In the full team app, Driver management belongs to the
// Safety Officer module (Person C). Kept minimal here for the Dashboard's
// license-expiry table and so trips/other forms can reference drivers.
router.get("/", async (req, res) => {
  try {
    const drivers = await prisma.driver.findMany({ orderBy: { name: "asc" } });
    res.json(drivers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
});

module.exports = router;
