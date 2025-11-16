import { Elysia } from "elysia";
import { prisma } from "../lib/prisma";

export const dashboardRoutes = new Elysia({ prefix: "/dashboard" })
  .get("/stats", async ({ set }) => {
    try {
      // Get total coupons
      const totalCoupons = await prisma.coupon.count();

      // Get used coupons
      const usedCoupons = await prisma.coupon.count({
        where: { status: "USED" },
      });

      // Get active campaigns (campaigns that haven't ended yet)
      const now = new Date();
      const activeCampaigns = await prisma.campaign.count({
        where: {
          endDate: {
            gte: now,
          },
        },
      });

      return {
        totalCoupons,
        usedCoupons,
        activeCampaigns,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      set.status = 500;
      return {
        error: "Failed to fetch dashboard stats",
        totalCoupons: 0,
        usedCoupons: 0,
        activeCampaigns: 0,
      };
    }
  });
