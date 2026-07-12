const express = require("express");
const prisma = require("../prisma");

const router = express.Router();

function toCsvValue(value) {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildDateFilter(from, to) {
  const filter = {};
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.gte = new Date(from);
    if (to) filter.createdAt.lte = new Date(to);
  }
  return filter;
}

// GET /export/trips.csv?from=&to=
router.get("/trips.csv", async (req, res) => {
  try {
    const { from, to } = req.query;

    const trips = await prisma.trip.findMany({
      where: buildDateFilter(from, to),
      include: { vehicle: true, driver: true },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Trip ID",
      "Source",
      "Destination",
      "Vehicle",
      "Driver",
      "Cargo Weight (kg)",
      "Planned Distance (km)",
      "Actual Distance (km)",
      "Fuel Consumed (L)",
      "Status",
      "Dispatched At",
      "Completed At",
    ];

    const rows = trips.map((t) => [
      t.id,
      t.source,
      t.destination,
      t.vehicle.registrationNumber,
      t.driver.name,
      t.cargoWeight,
      t.plannedDistance,
      t.actualDistance ?? "",
      t.fuelConsumed ?? "",
      t.status,
      t.dispatchedAt ? t.dispatchedAt.toISOString() : "",
      t.completedAt ? t.completedAt.toISOString() : "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(toCsvValue).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="trips-export-${Date.now()}.csv"`
    );
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export trips CSV" });
  }
});

// GET /export/trips.pdf?from=&to=  (bonus — simple text-based PDF, no extra deps)
router.get("/trips.pdf", async (req, res) => {
  try {
    const { from, to } = req.query;
    const trips = await prisma.trip.findMany({
      where: buildDateFilter(from, to),
      include: { vehicle: true, driver: true },
      orderBy: { createdAt: "desc" },
    });

    // Minimal hand-rolled single-page PDF (no external PDF library required).
    // For a production build, swap this for `pdfkit` and stream a real report.
    const lines = [
      "TransitOps - Trips Export",
      `Generated: ${new Date().toISOString()}`,
      "",
      ...trips.map(
        (t) =>
          `${t.vehicle.registrationNumber} | ${t.driver.name} | ${t.source} -> ${t.destination} | ${t.status}`
      ),
    ];

    const content = lines
      .map((line, i) => `(${line.replace(/[()\\]/g, "\\$&")}) Tj 0 -14 TD`)
      .join("\n");

    const pdf = `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>endobj
4 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
5 0 obj<< /Length ${content.length + 40} >>
stream
BT /F1 10 Tf 40 750 TD
${content}
ET
endstream
endobj
xref
0 6
trailer<< /Size 6 /Root 1 0 R >>
startxref
0
%%EOF`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="trips-export-${Date.now()}.pdf"`
    );
    res.send(pdf);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to export trips PDF" });
  }
});

module.exports = router;
