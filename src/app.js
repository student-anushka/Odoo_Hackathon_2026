require("dotenv").config();
const express = require("express");
const cors = require("cors");

const maintenanceRoutes = require("./maintenance/maintenance.routes");
// import other routes here as team builds them:
// const vehicleRoutes  = require("./vehicles/vehicle.routes");
// const driverRoutes   = require("./drivers/driver.routes");
// const tripRoutes     = require("./trips/trip.routes");
// const fuelRoutes     = require("./fuel/fuel.routes");
// const expenseRoutes  = require("./expenses/expense.routes");
// const analyticsRoutes = require("./analytics/analytics.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_, res) => res.json({ status: "ok" }));

// Routes
app.use("/api/maintenance", maintenanceRoutes);
// app.use("/api/vehicles",    vehicleRoutes);
// app.use("/api/drivers",     driverRoutes);
// app.use("/api/trips",       tripRoutes);
// app.use("/api/fuel-logs",   fuelRoutes);
// app.use("/api/expenses",    expenseRoutes);
// app.use("/api/analytics",   analyticsRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ data: null, error: "Internal server error" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`TransitOps API running on port ${PORT}`));

module.exports = app;
