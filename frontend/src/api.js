import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const client = axios.create({ baseURL: BASE_URL });

export const api = {
  // Stubs (read-only, owned by teammates in the full app)
  getVehicles: () => client.get("/vehicles").then((r) => r.data),
  getDrivers: () => client.get("/drivers").then((r) => r.data),

  // Maintenance
  getMaintenanceLogs: (vehicleId) =>
    client
      .get("/maintenance", { params: vehicleId ? { vehicleId } : {} })
      .then((r) => r.data),
  createMaintenanceLog: (payload) =>
    client.post("/maintenance", payload).then((r) => r.data),
  closeMaintenanceLog: (id) =>
    client.patch(`/maintenance/${id}/close`).then((r) => r.data),

  // Fuel
  getFuelLogs: (vehicleId) =>
    client
      .get("/fuel-logs", { params: vehicleId ? { vehicleId } : {} })
      .then((r) => r.data),
  createFuelLog: (payload) =>
    client.post("/fuel-logs", payload).then((r) => r.data),

  // Expenses
  getExpenses: (vehicleId) =>
    client
      .get("/expenses", { params: vehicleId ? { vehicleId } : {} })
      .then((r) => r.data),
  createExpense: (payload) =>
    client.post("/expenses", payload).then((r) => r.data),

  // Analytics
  getOperationalCost: () =>
    client.get("/analytics/operational-cost").then((r) => r.data),
  getFuelEfficiency: () =>
    client.get("/analytics/fuel-efficiency").then((r) => r.data),
  getFleetStatus: () => client.get("/analytics/fleet-status").then((r) => r.data),
  getRoi: () => client.get("/analytics/roi").then((r) => r.data),

  // Alerts
  getLicenseExpiryAlerts: (days = 30) =>
    client.get("/alerts/license-expiry", { params: { days } }).then((r) => r.data),

  // Export
  exportTripsCsvUrl: (from, to) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return `${BASE_URL}/export/trips.csv?${params.toString()}`;
  },
  exportTripsPdfUrl: (from, to) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return `${BASE_URL}/export/trips.pdf?${params.toString()}`;
  },
};

export default api;
