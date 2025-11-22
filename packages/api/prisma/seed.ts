import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

function generateQRToken(): string {
  return randomBytes(16).toString('hex');
}

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@coupon.com" },
    update: {},
    create: {
      email: "admin@coupon.com",
      password: adminPassword,
      name: "Admin User",
      role: "ADMIN",
    },
  });

  console.log("✅ Created admin user:", admin.email);

  // Create staff user
  const staffPassword = await bcrypt.hash("staff123", 10);
  const staff = await prisma.user.upsert({
    where: { email: "staff@coupon.com" },
    update: {},
    create: {
      email: "staff@coupon.com",
      password: staffPassword,
      name: "Staff User",
      role: "STAFF",
    },
  });

  console.log("✅ Created staff user:", staff.email);

  // Create sample companies
  const company1 = await prisma.company.upsert({
    where: { name: "บริษัท ขนส่งทางน้ำ จำกัด" },
    update: {},
    create: {
      name: "บริษัท ขนส่งทางน้ำ จำกัด",
      contactInfo: "โทร: 02-123-4567, อีเมล: contact@transport.com",
    },
  });

  console.log("✅ Created company:", company1.name);

  const company2 = await prisma.company.upsert({
    where: { name: "บริษัท ท่องเที่ยวทะเล จำกัด" },
    update: {},
    create: {
      name: "บริษัท ท่องเที่ยวทะเล จำกัด",
      contactInfo: "โทร: 02-765-4321, อีเมล: info@seatour.com",
    },
  });

  console.log("✅ Created company:", company2.name);

  // Create wallets for company1 (both FUEL and BOAT)
  const fuelWallet1 = await prisma.wallet.upsert({
    where: {
      companyId_type: {
        companyId: company1.id,
        type: "FUEL"
      }
    },
    update: {},
    create: {
      companyId: company1.id,
      type: "FUEL",
      balance: 1000, // 1000 ลิตร
      qrToken: generateQRToken(),
    },
  });

  console.log(`✅ Created FUEL wallet for ${company1.name}: ${fuelWallet1.balance} ลิตร`);

  const boatWallet1 = await prisma.wallet.upsert({
    where: {
      companyId_type: {
        companyId: company1.id,
        type: "BOAT"
      }
    },
    update: {},
    create: {
      companyId: company1.id,
      type: "BOAT",
      balance: 50, // 50 เที่ยว
      qrToken: generateQRToken(),
    },
  });

  console.log(`✅ Created BOAT wallet for ${company1.name}: ${boatWallet1.balance} เที่ยว`);

  // Create wallets for company2 (both FUEL and BOAT)
  const fuelWallet2 = await prisma.wallet.upsert({
    where: {
      companyId_type: {
        companyId: company2.id,
        type: "FUEL"
      }
    },
    update: {},
    create: {
      companyId: company2.id,
      type: "FUEL",
      balance: 500, // 500 ลิตร
      qrToken: generateQRToken(),
    },
  });

  console.log(`✅ Created FUEL wallet for ${company2.name}: ${fuelWallet2.balance} ลิตร`);

  const boatWallet2 = await prisma.wallet.upsert({
    where: {
      companyId_type: {
        companyId: company2.id,
        type: "BOAT"
      }
    },
    update: {},
    create: {
      companyId: company2.id,
      type: "BOAT",
      balance: 30, // 30 เที่ยว
      qrToken: generateQRToken(),
    },
  });

  console.log(`✅ Created BOAT wallet for ${company2.name}: ${boatWallet2.balance} เที่ยว`);

  // Create sample topup logs
  await prisma.topupLog.create({
    data: {
      walletId: fuelWallet1.id,
      amountAdded: 1000,
      adminId: admin.id,
    },
  });

  await prisma.topupLog.create({
    data: {
      walletId: boatWallet1.id,
      amountAdded: 50,
      adminId: admin.id,
    },
  });

  console.log("✅ Created sample topup logs");

  console.log("🎉 Seeding completed!");
  console.log("\n📝 Test accounts:");
  console.log("   Admin: admin@coupon.com / admin123");
  console.log("   Staff: staff@coupon.com / staff123");
  console.log("\n🏢 Sample companies created:");
  console.log(`   - ${company1.name}`);
  console.log(`   - ${company2.name}`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
