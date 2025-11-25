import { Elysia, t } from "elysia";
import { prisma } from "../lib/prisma";
import { authenticateRequest } from "../utils/auth";

export const companyRoutes = new Elysia({ prefix: "/companies" })
  // Get all companies
  .get("/", async ({ headers, set }) => {
    try {
      const user = await authenticateRequest(headers.authorization);
      if (!user || user.role !== "ADMIN") {
        set.status = 403;
        return { error: "Forbidden: Admin access required" };
      }

      const companies = await prisma.company.findMany({
        include: {
          wallets: {
            select: {
              id: true,
              type: true,
              balance: true,
              qrToken: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return companies;
    } catch (error: any) {
      set.status = 500;
      return { error: "Failed to fetch companies", message: error.message };
    }
  })

  // Get company by ID
  .get("/:id", async ({ headers, params, set }) => {
    try {
      const user = await authenticateRequest(headers.authorization);
      if (!user) {
        set.status = 401;
        return { error: "Unauthorized" };
      }

      const company = await prisma.company.findUnique({
        where: { id: params.id },
        include: {
          wallets: {
            include: {
              topupLogs: {
                take: 10,
                orderBy: { createdAt: "desc" },
                include: {
                  admin: {
                    select: { name: true, email: true },
                  },
                },
              },
              usageLogs: {
                take: 10,
                orderBy: { createdAt: "desc" },
                include: {
                  staff: {
                    select: { name: true, email: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!company) {
        set.status = 404;
        return { error: "Company not found" };
      }

      return company;
    } catch (error: any) {
      set.status = 500;
      return { error: "Failed to fetch company", message: error.message };
    }
  })

  // Create new company
  .post(
    "/",
    async ({ headers, body, set }) => {
      try {
        const user = await authenticateRequest(headers.authorization);
        if (!user || user.role !== "ADMIN") {
          set.status = 403;
          return { error: "Forbidden: Admin access required" };
        }

        const company = await prisma.company.create({
          data: {
            name: body.name,
            contactInfo: body.contactInfo || null,
          },
          include: {
            wallets: {
              select: {
                id: true,
                type: true,
                balance: true,
                qrToken: true,
              },
            },
          },
        });

        return company;
      } catch (error: any) {
        set.status = 500;
        return { error: "Failed to create company", message: error.message };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        contactInfo: t.Optional(t.String()),
      }),
    }
  )

  // Update company
  .put(
    "/:id",
    async ({ headers, params, body, set }) => {
      try {
        const user = await authenticateRequest(headers.authorization);
        if (!user || user.role !== "ADMIN") {
          set.status = 403;
          return { error: "Forbidden: Admin access required" };
        }

        const company = await prisma.company.update({
          where: { id: params.id },
          data: {
            name: body.name,
            contactInfo: body.contactInfo,
          },
          include: {
            wallets: {
              select: {
                id: true,
                type: true,
                balance: true,
                qrToken: true,
              },
            },
          },
        });

        return company;
      } catch (error: any) {
        set.status = 500;
        return { error: "Failed to update company", message: error.message };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        contactInfo: t.Optional(t.String()),
      }),
    }
  )

  // Delete company
  .delete("/:id", async ({ headers, params, set }) => {
    try {
      const user = await authenticateRequest(headers.authorization);
      if (!user || user.role !== "ADMIN") {
        set.status = 403;
        return { error: "Forbidden: Admin access required" };
      }

      await prisma.company.delete({
        where: { id: params.id },
      });

      return { message: "Company deleted successfully" };
    } catch (error: any) {
      set.status = 500;
      return { error: "Failed to delete company", message: error.message };
    }
  });
