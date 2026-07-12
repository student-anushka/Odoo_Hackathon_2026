<<<<<<< HEAD
# TransitOps — Person D module

Maintenance · Fuel & Expenses · Cost Aggregation · Reports/Analytics · CSV/PDF Export · License Expiry Alerts

This is a **standalone, runnable slice** of the TransitOps hackathon app covering
Person D's part of the plan (Hours 1–8). To make it runnable on its own (without
Person A/B/C's modules), it includes:

- A full Prisma schema (Vehicle, Driver, Trip, MaintenanceLog, FuelLog, Expense)
- Read-only `/vehicles` and `/drivers` endpoints (stubs — owned by teammates in
  the real team app) just so Person D's forms have data to work with
- Seed data with sample vehicles, drivers (including one expired and one
  expiring license, to demo the alert banner), trips, maintenance, fuel logs
  and expenses

## Stack

- **Backend:** Node.js, Express, Prisma ORM, SQLite (zero external DB setup —
  swap the `DATABASE_URL` in `.env` for a Postgres connection string if your
  team is using Postgres for the shared app)
- **Frontend:** React 18 + Vite, Recharts for charts, plain fetch via Axios.
  No React Router — a simple in-memory tab switch, so there's one less
  dependency for an 8-hour build.

## Quick start

### 1. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

The API runs at `http://localhost:4000`. Check `http://localhost:4000/health`.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env   # points VITE_API_URL at the backend
npm run dev
```

Open `http://localhost:5173`.

## What's implemented (mapped to your plan)

| Hour | Item | Where |
|---|---|---|
| 1–2 | Maintenance API: `POST /maintenance` (transaction → vehicle `IN_SHOP`), `PATCH /maintenance/:id/close` (restore unless `RETIRED`), `GET /maintenance?vehicleId=` | `backend/src/routes/maintenance.js` |
| 3 | Fuel API `POST/GET /fuel-logs`, Expense API `POST/GET /expenses` | `backend/src/routes/fuelLogs.js`, `expenses.js` |
| 4 | Cost aggregation via `prisma.groupBy` → `/analytics/operational-cost` | `backend/src/routes/analytics.js` |
| 5 | Maintenance/Fuel/Expense forms wired to the API, auto-refetch on submit/close | `frontend/src/components/*.jsx` |
| 6 | Reports page: BarChart (cost/vehicle), LineChart (fuel efficiency), PieChart (fleet status), ROI cards | `frontend/src/pages/Reports.jsx` + `/analytics/fuel-efficiency`, `/analytics/fleet-status`, `/analytics/roi` |
| 7 | CSV export (`GET /export/trips.csv`, blob download via `<a href>`), date range filter, PDF export (bonus, minimal hand-rolled PDF) | `backend/src/routes/exports.js` |
| 8 | License expiry query (`GET /alerts/license-expiry?days=30`), Dashboard banner + highlighted driver rows | `backend/src/routes/alerts.js`, `frontend/src/pages/Dashboard.jsx` |

Nodemailer email reminders (bonus) were **not** implemented — wire it into
`alerts.js` if you want it; the query for who to email is already there.

## Assumptions made (flag these with your team)

- **ROI / `revenue`:** the spec's ROI formula needs a "Revenue" figure per
  vehicle that isn't defined anywhere else in the brief. Added a `revenue`
  field on `Vehicle` as a placeholder — swap for however Person A/B end up
  deriving revenue (e.g. sum of trip billing) once that's defined.
- **PDF export** is a minimal hand-rolled single-page PDF with no external
  dependency, good enough to demo the button/flow. If you have time left,
  swap in `pdfkit` for a properly laid-out report.
- **Vehicles/Drivers endpoints** here are read-only stubs purely so this
  module runs standalone. Don't merge these routes into the real app if
  Person A/C already own `/vehicles` and `/drivers` — merge schemas/routes
  carefully instead.

## API reference (this module)

```
GET   /vehicles                        (stub, read-only)
GET   /drivers                         (stub, read-only)

POST  /maintenance                     { vehicleId, type, description?, cost? }
PATCH /maintenance/:id/close
GET   /maintenance?vehicleId=

POST  /fuel-logs                       { vehicleId, tripId?, liters, costPerLiter }
GET   /fuel-logs?vehicleId=

POST  /expenses                        { vehicleId, type: TOLL|MAINTENANCE|MISC, amount, description? }
GET   /expenses?vehicleId=

GET   /analytics/operational-cost
GET   /analytics/fuel-efficiency
GET   /analytics/fleet-status
GET   /analytics/roi

GET   /export/trips.csv?from=&to=
GET   /export/trips.pdf?from=&to=

GET   /alerts/license-expiry?days=30
```

## Notes for merging with teammates

- If the team settles on Postgres, change `datasource db { provider = "sqlite" }`
  to `"postgresql"` in `prisma/schema.prisma` and update `DATABASE_URL`.
- Drop the stub `vehicles.js` / `drivers.js` routes and this schema's
  Vehicle/Driver/Trip models in favor of the shared ones once you merge —
  keep the enums (`VehicleStatus`, `DriverStatus`, etc.) consistent across
  everyone's schema files.
=======
# Odoo_Hackathon_2026
Odoo Hackathon 2026 - Team of 4 Coders 
>>>>>>> 88d74b0781ea4e1944c51877ebf8391bd5353ea8
