import { Elysia, t } from "elysia";
import { prisma } from "../lib/prisma";
import { generateCouponCode, generateQRCode } from "../utils/qrcode";
import { generateCouponPDF } from "../utils/pdf";

export const couponRoutes = new Elysia({ prefix: "/coupons" })
  .get("/", async ({ query }) => {
    try {
      const { campaignId, status } = query;

      const coupons = await prisma.coupon.findMany({
        where: {
          ...(campaignId && { campaignId }),
          ...(status && { status }),
        },
        include: {
          campaign: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return { coupons };
    } catch (error) {
      return { error: "Failed to fetch coupons" };
    }
  })
  .get("/:id", async ({ params, set }) => {
    try {
      const coupon = await prisma.coupon.findUnique({
        where: { id: params.id },
        include: {
          campaign: true,
          redemptions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!coupon) {
        set.status = 404;
        return { error: "Coupon not found" };
      }

      return { coupon };
    } catch (error) {
      set.status = 500;
      return { error: "Failed to fetch coupon" };
    }
  })
  .post(
    "/generate",
    async ({ body, set }) => {
      try {
        const { campaignId, quantity } = body;

        // Check if campaign exists
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          include: {
            _count: {
              select: { coupons: true },
            },
          },
        });

        if (!campaign) {
          set.status = 404;
          return { error: "Campaign not found" };
        }

        // Check if we can generate more coupons
        const currentCount = campaign._count.coupons;
        const remaining = campaign.totalLimit - currentCount;

        if (quantity > remaining) {
          set.status = 400;
          return {
            error: `Cannot generate ${quantity} coupons. Only ${remaining} remaining.`,
          };
        }

        // Generate coupons
        const coupons = [];
        for (let i = 0; i < quantity; i++) {
          const code = generateCouponCode();
          const qrCode = await generateQRCode(code);

          const coupon = await prisma.coupon.create({
            data: {
              code,
              qrCode,
              campaignId,
            },
          });

          coupons.push(coupon);
        }

        return { coupons, count: coupons.length };
      } catch (error) {
        console.error("Error generating coupons:", error);
        set.status = 500;
        return { error: "Failed to generate coupons" };
      }
    },
    {
      body: t.Object({
        campaignId: t.String(),
        quantity: t.Number({ minimum: 1 }),
      }),
    }
  )
  .get("/code/:code", async ({ params, set }) => {
    try {
      const coupon = await prisma.coupon.findUnique({
        where: { code: params.code },
        include: {
          campaign: true,
          redemptions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!coupon) {
        set.status = 404;
        return { error: "Coupon not found" };
      }

      return { coupon };
    } catch (error) {
      set.status = 500;
      return { error: "Failed to fetch coupon" };
    }
  })
  .post(
    "/export-pdf",
    async ({ body, set }) => {
      try {
        const { couponIds, campaignId } = body;

        let coupons;

        if (couponIds && couponIds.length > 0) {
          // Export specific coupons
          coupons = await prisma.coupon.findMany({
            where: {
              id: { in: couponIds },
            },
            include: {
              campaign: true,
            },
          });
        } else if (campaignId) {
          // Export all coupons from campaign
          coupons = await prisma.coupon.findMany({
            where: {
              campaignId,
            },
            include: {
              campaign: true,
            },
          });
        } else {
          set.status = 400;
          return { error: "Must provide couponIds or campaignId" };
        }

        if (coupons.length === 0) {
          set.status = 404;
          return { error: "No coupons found" };
        }

        // Generate PDF
        const pdfBuffer = await generateCouponPDF(coupons);

        set.headers["Content-Type"] = "application/pdf";
        set.headers["Content-Disposition"] = `attachment; filename="coupons-${Date.now()}.pdf"`;

        return new Response(pdfBuffer);
      } catch (error) {
        console.error("Error exporting PDF:", error);
        set.status = 500;
        return { error: "Failed to export PDF" };
      }
    },
    {
      body: t.Object({
        couponIds: t.Optional(t.Array(t.String())),
        campaignId: t.Optional(t.String()),
      }),
    }
  );
