import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

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

  // Create sample campaign
  const campaign = await prisma.campaign.upsert({
    where: { id: "sample-campaign-id" },
    update: {},
    create: {
      id: "sample-campaign-id",
      name: "Welcome Promotion",
      description: "Get 10% discount on your first purchase",
      totalLimit: 100,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
    },
  });

  console.log("✅ Created sample campaign:", campaign.name);

  console.log("🎉 Seeding completed!");
  console.log("\n📝 Test accounts:");
  console.log("   Admin: admin@coupon.com / admin123");
  console.log("   Staff: staff@coupon.com / staff123");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
