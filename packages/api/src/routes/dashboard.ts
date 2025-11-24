import { Elysia, t } from "elysia";
import { prisma } from "../lib/prisma";
import { authenticateRequest } from "../utils/auth";

export const dashboardRoutes = new Elysia({ prefix: "/dashboard" })
  // Get overall statistics
  .get("/stats", async ({ headers, set }) => {
    try {
      const user = await authenticateRequest(headers.authorization);
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const totalCompanies = await prisma.company.count();
      const totalWallets = await prisma.wallet.count();
      const fuelWallets = await prisma.wallet.count({
        where: { type: "FUEL" },
      });
      const boatWallets = await prisma.wallet.count({
        where: { type: "BOAT" },
      });

      // Calculate total balances
      const fuelBalance = await prisma.wallet.aggregate({
        where: { type: "FUEL" },
        _sum: { balance: true },
      });

      const boatBalance = await prisma.wallet.aggregate({
        where: { type: "BOAT" },
        _sum: { balance: true },
      });

      // Recent activities (last 7 days)
      const recentTopups = await prisma.topupLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      const recentUsages = await prisma.usageLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      });

      return {
        totalCompanies,
        totalWallets,
        fuelWallets,
        boatWallets,
        totalFuelBalance: fuelBalance._sum.balance || 0,
        totalBoatBalance: boatBalance._sum.balance || 0,
        recentTopups,
        recentUsages,
      };
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      set.status = 500;
      return { error: "Failed to fetch stats", message: error.message };
    }
  })

  // Get Fuel Report
  .get("/reports/fuel", async ({ headers, query, set }) => {
    try {
      const user = await authenticateRequest(headers.authorization);
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const startDate = query.startDate
        ? new Date(query.startDate as string)
        : undefined;
      const endDate = query.endDate
        ? new Date(query.endDate as string)
        : undefined;

      const where: any = {
        wallet: { type: "FUEL" },
      };
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      // Get all fuel-related transactions
      const topups = await prisma.topupLog.findMany({
        where,
        include: {
          wallet: {
            include: {
              company: { select: { name: true } },
            },
          },
          admin: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      });

      const usages = await prisma.usageLog.findMany({
        where,
        include: {
          wallet: {
            include: {
              company: { select: { name: true } },
            },
          },
          staff: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      });

      return {
        topups,
        usages,
      };
    } catch (error: any) {
      console.error("Error fetching fuel report:", error);
      set.status = 500;
      return { error: "Failed to fetch fuel report", message: error.message };
    }
  })

  // Get Boat Report
  .get("/reports/boat", async ({ headers, query, set }) => {
    try {
      const user = await authenticateRequest(headers.authorization);
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const startDate = query.startDate
        ? new Date(query.startDate as string)
        : undefined;
      const endDate = query.endDate
        ? new Date(query.endDate as string)
        : undefined;

      const where: any = {
        wallet: { type: "BOAT" },
      };
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      // Get all boat-related transactions
      const topups = await prisma.topupLog.findMany({
        where,
        include: {
          wallet: {
            include: {
              company: { select: { name: true } },
            },
          },
          admin: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      });

      const usages = await prisma.usageLog.findMany({
        where,
        include: {
          wallet: {
            include: {
              company: { select: { name: true } },
            },
          },
          staff: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      });

      return {
        topups,
        usages,
      };
    } catch (error: any) {
      console.error("Error fetching boat report:", error);
      set.status = 500;
      return { error: "Failed to fetch boat report", message: error.message };
    }
  });
