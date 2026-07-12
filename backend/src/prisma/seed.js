const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function upsertUser(data) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (!existing) await prisma.user.create({ data });
}

async function upsertVehicle(data) {
  const existing = await prisma.vehicle.findUnique({ where: { regNumber: data.regNumber } });
  if (!existing) await prisma.vehicle.create({ data });
}

async function upsertDriver(data) {
  const existing = await prisma.driver.findUnique({ where: { licenseNumber: data.licenseNumber } });
  if (!existing) await prisma.driver.create({ data });
}

async function main() {
  const hash = await bcrypt.hash('password123', 10);

  await upsertUser({ email: 'manager@transitops.com', password: hash, name: 'Fleet Manager', role: 'FLEET_MANAGER' });
  await upsertUser({ email: 'driver@transitops.com', password: hash, name: 'John Driver', role: 'DRIVER' });
  await upsertUser({ email: 'safety@transitops.com', password: hash, name: 'Safety Officer', role: 'SAFETY_OFFICER' });
  await upsertUser({ email: 'finance@transitops.com', password: hash, name: 'Finance Analyst', role: 'FINANCIAL_ANALYST' });

  await upsertVehicle({ regNumber: 'VAN-05', name: 'Ford Transit Van', type: 'Van', maxLoadKg: 500, odometerKm: 12000, acquisitionCost: 35000, status: 'AVAILABLE', region: 'North' });
  await upsertVehicle({ regNumber: 'TRK-01', name: 'Isuzu NPR Truck', type: 'Truck', maxLoadKg: 3000, odometerKm: 45000, acquisitionCost: 75000, status: 'AVAILABLE', region: 'South' });
  await upsertVehicle({ regNumber: 'PKP-03', name: 'Toyota Hilux', type: 'Pickup', maxLoadKg: 800, odometerKm: 8000, acquisitionCost: 28000, status: 'IN_SHOP', region: 'East' });

  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 2);
  const pastDate = new Date();
  pastDate.setMonth(pastDate.getMonth() - 1);

  await upsertDriver({ name: 'Alex Santos', licenseNumber: 'LIC-001', licenseCategory: 'B', licenseExpiry: futureDate, contactNumber: '09171234567', safetyScore: 95, status: 'AVAILABLE' });
  await upsertDriver({ name: 'Maria Cruz', licenseNumber: 'LIC-002', licenseCategory: 'C', licenseExpiry: futureDate, contactNumber: '09181234567', safetyScore: 88, status: 'AVAILABLE' });
  await upsertDriver({ name: 'Expired Driver', licenseNumber: 'LIC-003', licenseCategory: 'B', licenseExpiry: pastDate, contactNumber: '09191234567', safetyScore: 70, status: 'AVAILABLE' });

  console.log('✅ Seed complete');
  console.log('Login: manager@transitops.com / password123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
