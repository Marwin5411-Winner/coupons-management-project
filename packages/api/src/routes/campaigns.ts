import { Elysia, t } from "elysia";
import { prisma } from "../lib/prisma";

export const campaignRoutes = new Elysia({ prefix: "/campaigns" })
  .get("/", async ({ query }) => {
    try {
      const campaigns = await prisma.campaign.findMany({
        include: {
          _count: {
            select: { coupons: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return { campaigns };
    } catch (error) {
      return { error: "Failed to fetch campaigns" };
    }
  })
  .get("/:id", async ({ params, set }) => {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: params.id },
        include: {
          coupons: {
            orderBy: { createdAt: "desc" },
          },
          _count: {
            select: { coupons: true },
          },
        },
      });

      if (!campaign) {
        set.status = 404;
        return { error: "Campaign not found" };
      }

      return { campaign };
    } catch (error) {
      set.status = 500;
      return { error: "Failed to fetch campaign" };
    }
  })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const { name, description, totalLimit, startDate, endDate } = body;

        const campaign = await prisma.campaign.create({
          data: {
            name,
            description,
            totalLimit,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
          },
        });

        return { campaign };
      } catch (error) {
        set.status = 500;
        return { error: "Failed to create campaign" };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        totalLimit: t.Number({ minimum: 1 }),
        startDate: t.String(),
        endDate: t.String(),
      }),
    }
  )
  .patch(
    "/:id",
    async ({ params, body, set }) => {
      try {
        const campaign = await prisma.campaign.update({
          where: { id: params.id },
          data: {
            ...body,
            startDate: body.startDate ? new Date(body.startDate) : undefined,
            endDate: body.endDate ? new Date(body.endDate) : undefined,
          },
        });

        return { campaign };
      } catch (error) {
        set.status = 500;
        return { error: "Failed to update campaign" };
      }
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        totalLimit: t.Optional(t.Number({ minimum: 1 })),
        startDate: t.Optional(t.String()),
        endDate: t.Optional(t.String()),
      }),
    }
  )
  .delete("/:id", async ({ params, set }) => {
    try {
      await prisma.campaign.delete({
        where: { id: params.id },
      });

      return { message: "Campaign deleted successfully" };
    } catch (error) {
      set.status = 500;
      return { error: "Failed to delete campaign" };
    }
  })
  .get("/:id/stats", async ({ params, set }) => {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: params.id },
        include: {
          coupons: {
            select: {
              status: true,
            },
          },
        },
      });

      if (!campaign) {
        set.status = 404;
        return { error: "Campaign not found" };
      }

      const total = campaign.coupons.length;
      const available = campaign.coupons.filter((c) => c.status === "AVAILABLE").length;
      const used = campaign.coupons.filter((c) => c.status === "USED").length;
      const expired = campaign.coupons.filter((c) => c.status === "EXPIRED").length;

      return {
        stats: {
          total,
          available,
          used,
          expired,
          totalLimit: campaign.totalLimit,
          remaining: campaign.totalLimit - total,
        },
      };
    } catch (error) {
      set.status = 500;
      return { error: "Failed to fetch campaign stats" };
    }
  });
