const express = require("express");
const prisma = require("../prisma");

const router = express.Router();

// GET /alerts/license-expiry?days=30
// Drivers whose license has already expired, or expires within `days`.
router.get("/license-expiry", async (req, res) => {
  try {
    const days = req.query.days ? Number(req.query.days) : 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);

    const drivers = await prisma.driver.findMany({
      where: { licenseExpiry: { lte: cutoff } },
      orderBy: { licenseExpiry: "asc" },
    });

    const now = new Date();
    const result = drivers.map((d) => ({
      ...d,
      isExpired: d.licenseExpiry < now,
      daysRemaining: Math.ceil(
        (d.licenseExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch license expiry alerts" });
  }
});

module.exports = router;
