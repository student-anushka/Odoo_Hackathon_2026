const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log("Seeding database...");

  await prisma.expense.deleteMany();
  await prisma.fuelLog.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();

  const van05 = await prisma.vehicle.create({
    data: {
      registrationNumber: "VAN-05",
      name: "Van 05",
      type: "Van",
      maxLoadCapacity: 500,
      odometer: 12000,
      acquisitionCost: 18000,
      revenue: 9500,
      status: "AVAILABLE",
    },
  });

  const truck12 = await prisma.vehicle.create({
    data: {
      registrationNumber: "TRK-12",
      name: "Truck 12",
      type: "Truck",
      maxLoadCapacity: 3000,
      odometer: 45210,
      acquisitionCost: 42000,
      revenue: 21000,
      status: "AVAILABLE",
    },
  });

  const van08 = await prisma.vehicle.create({
    data: {
      registrationNumber: "VAN-08",
      name: "Van 08",
      type: "Van",
      maxLoadCapacity: 600,
      odometer: 8300,
      acquisitionCost: 19500,
      revenue: 4200,
      status: "IN_SHOP",
    },
  });

  const alex = await prisma.driver.create({
    data: {
      name: "Alex Rivera",
      licenseNumber: "DL-1001",
      licenseCategory: "LMV",
      licenseExpiry: daysFromNow(120),
      contactNumber: "555-0101",
      safetyScore: 92,
      status: "AVAILABLE",
    },
  });

  const priya = await prisma.driver.create({
    data: {
      name: "Priya Nair",
      licenseNumber: "DL-1002",
      licenseCategory: "HMV",
      licenseExpiry: daysFromNow(14), // expiring soon -> triggers alert banner
      contactNumber: "555-0102",
      safetyScore: 88,
      status: "AVAILABLE",
    },
  });

  const sam = await prisma.driver.create({
    data: {
      name: "Sam Okoro",
      licenseNumber: "DL-1003",
      licenseCategory: "LMV",
      licenseExpiry: daysFromNow(-5), // already expired -> triggers alert banner
      contactNumber: "555-0103",
      safetyScore: 75,
      status: "SUSPENDED",
    },
  });

  const trip1 = await prisma.trip.create({
    data: {
      source: "Mumbai DC",
      destination: "Pune Hub",
      vehicleId: van05.id,
      driverId: alex.id,
      cargoWeight: 450,
      plannedDistance: 150,
      actualDistance: 155,
      fuelConsumed: 18,
      status: "COMPLETED",
      dispatchedAt: daysFromNow(-6),
      completedAt: daysFromNow(-5),
    },
  });

  const trip2 = await prisma.trip.create({
    data: {
      source: "Delhi DC",
      destination: "Jaipur Hub",
      vehicleId: truck12.id,
      driverId: priya.id,
      cargoWeight: 2200,
      plannedDistance: 280,
      actualDistance: 285,
      fuelConsumed: 55,
      status: "COMPLETED",
      dispatchedAt: daysFromNow(-3),
      completedAt: daysFromNow(-2),
    },
  });

  await prisma.maintenanceLog.create({
    data: {
      vehicleId: van08.id,
      type: "Oil Change",
      description: "Routine oil + filter change",
      cost: 120,
      status: "OPEN",
      openedAt: daysFromNow(-2),
    },
  });

  await prisma.maintenanceLog.create({
    data: {
      vehicleId: van05.id,
      type: "Tire Rotation",
      description: "Rotated all 4 tires",
      cost: 60,
      status: "CLOSED",
      openedAt: daysFromNow(-20),
      closedAt: daysFromNow(-19),
    },
  });

  await prisma.fuelLog.create({
    data: {
      vehicleId: van05.id,
      tripId: trip1.id,
      liters: 18,
      costPerLiter: 1.6,
      totalCost: 18 * 1.6,
      date: daysFromNow(-5),
    },
  });

  await prisma.fuelLog.create({
    data: {
      vehicleId: truck12.id,
      tripId: trip2.id,
      liters: 55,
      costPerLiter: 1.55,
      totalCost: 55 * 1.55,
      date: daysFromNow(-2),
    },
  });

  await prisma.expense.create({
    data: {
      vehicleId: van05.id,
      type: "TOLL",
      amount: 12.5,
      description: "Mumbai-Pune expressway toll",
      date: daysFromNow(-5),
    },
  });

  await prisma.expense.create({
    data: {
      vehicleId: truck12.id,
      type: "MISC",
      amount: 30,
      description: "Parking fees",
      date: daysFromNow(-2),
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
