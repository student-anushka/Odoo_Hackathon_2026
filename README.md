# TransitOps — Trip Module

Complete implementation of Person C's scope: Trip Management + Business Rules.

## Quick Start

### Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
node src/prisma/seed.js   # optional demo data
npm run dev               # starts on :3001
```

### Frontend
```bash
cd frontend
npm install
npm start                 # starts on :3000, proxies API to :3001
```

### Demo logins (after seeding)
| Role | Email | Password |
|---|---|---|
| Fleet Manager | manager@transitops.com | password123 |
| Driver | driver@transitops.com | password123 |
| Safety Officer | safety@transitops.com | password123 |
| Finance | finance@transitops.com | password123 |

---

## Architecture

```
backend/
  src/
    index.js              — Express app + route mounting
    middleware/auth.js    — JWT auth + RBAC middleware
    routes/
      authRoutes.js       — POST /auth/login, /register
      vehicleRoutes.js    — CRUD /vehicles, GET /vehicles/available
      driverRoutes.js     — CRUD /drivers, GET /drivers/available
      tripRoutes.js       ★ CORE — all trip endpoints + business rules
      maintenanceRoutes.js
      fuelRoutes.js
      reportRoutes.js     — dashboard KPIs + analytics + expiring licenses
    prisma/
      seed.js
  prisma/
    schema.prisma         — SQLite schema (swap to Postgres for prod)

frontend/src/
  api/index.js            — axios client, all API calls
  hooks/useAuth.js        — AuthContext + login/logout
  App.js                  — Router + PrivateRoute
  App.css                 — Dark theme design system
  components/
    Layout.js             — Sidebar nav
    common.js             — Modal, Toast, Badge, Spinner, ConfirmModal
  pages/
    Login.js
    Dashboard.js          — KPIs grid + expiring licenses alert
    Vehicles.js           — CRUD with filters
    Drivers.js            — CRUD with license expiry highlighting
    Trips.js              ★ CORE — create/dispatch/complete/cancel + inline errors
    Maintenance.js        — create/close with status warnings
    FuelExpenses.js       — fuel logs + expenses + summary totals
    Reports.js            — bar charts + table + CSV export
```

---

## All 9 Business Rules (tripRoutes.js)

| Rule | Where enforced |
|---|---|
| Vehicle must be AVAILABLE | POST /trips + PATCH /dispatch |
| Driver must be AVAILABLE | POST /trips + PATCH /dispatch |
| Driver must not be SUSPENDED | POST /trips (status check) |
| License must not be expired | POST /trips + PATCH /dispatch |
| Cargo ≤ vehicle max load | POST /trips |
| Dispatch → vehicle+driver = ON_TRIP | PATCH /dispatch (prisma.$transaction) |
| Complete → vehicle+driver = AVAILABLE | PATCH /complete (prisma.$transaction) |
| Cancel dispatched → restores AVAILABLE | PATCH /cancel (prisma.$transaction) |
| Retired/In Shop never dispatched | GET /vehicles/available filters them out |

All status transitions are **atomic** via `prisma.$transaction` — all 3 records update or none do.

---

## API Reference (Trip Endpoints)

```
POST   /api/trips                 — create trip (DRAFT)
GET    /api/trips                 — list with ?status ?vehicleId ?driverId ?from ?to ?page ?limit
GET    /api/trips/:id             — single trip with vehicle + driver
PATCH  /api/trips/:id/dispatch    — DRAFT → DISPATCHED (atomic)
PATCH  /api/trips/:id/complete    — DISPATCHED → COMPLETED (body: endOdometerKm, fuelConsumedL)
PATCH  /api/trips/:id/cancel      — DRAFT|DISPATCHED → CANCELLED
```

All endpoints require `Authorization: Bearer <token>`.

Error responses include a `field` key for inline form display:
```json
{ "error": "Cargo weight (600 kg) exceeds vehicle max load (500 kg)", "field": "cargoWeightKg" }
```
