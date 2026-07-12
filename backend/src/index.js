require("dotenv").config();
const express = require("express");
const cors = require("cors");

const maintenanceRoutes = require("./routes/maintenance");
const fuelLogRoutes = require("./routes/fuelLogs");
const expenseRoutes = require("./routes/expenses");
const analyticsRoutes = require("./routes/analytics");
const exportRoutes = require("./routes/exports");
const alertRoutes = require("./routes/alerts");
const vehicleRoutes = require("./routes/vehicles");
const driverRoutes = require("./routes/drivers");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true, service: "transitops-person-d" }));

app.use("/maintenance", maintenanceRoutes);
app.use("/fuel-logs", fuelLogRoutes);
app.use("/expenses", expenseRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/export", exportRoutes);
app.use("/alerts", alertRoutes);

// Read-only stubs so this module runs standalone (owned by teammates in the real app)
app.use("/vehicles", vehicleRoutes);
app.use("/drivers", driverRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`TransitOps (Person D module) API running on http://localhost:${PORT}`);
});
