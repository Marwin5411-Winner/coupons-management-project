import { Elysia, t } from "elysia";
import { prisma } from "../lib/prisma";
import { hashPassword, verifyPassword, generateToken } from "../lib/auth";

export const authRoutes = new Elysia({ prefix: "/auth" })
  .post(
    "/register",
    async ({ body, set }) => {
      try {
        const { email, password, name, role } = body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          set.status = 400;
          return { error: "User already exists" };
        }

        // Hash password
        const hashedPassword = await hashPassword(password);

        // Create user
        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role: role || "STAFF",
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
        });

        // Generate token
        const token = generateToken({
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        return {
          user,
          token,
        };
      } catch (error) {
        set.status = 500;
        return { error: "Failed to register user" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String({ minLength: 6 }),
        name: t.String(),
        role: t.Optional(t.Union([t.Literal("ADMIN"), t.Literal("STAFF")])),
      }),
    }
  )
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        const { email, password } = body;

        // Find user
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          set.status = 401;
          return { error: "Invalid credentials" };
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password);

        if (!isValid) {
          set.status = 401;
          return { error: "Invalid credentials" };
        }

        // Generate token
        const token = generateToken({
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        };
      } catch (error) {
        set.status = 500;
        return { error: "Failed to login" };
      }
    },
    {
      body: t.Object({
        email: t.String({ format: "email" }),
        password: t.String(),
      }),
    }
  )
  .get("/me", async ({ headers, set }) => {
    try {
      const authorization = headers.authorization;

      if (!authorization) {
        set.status = 401;
        return { error: "No token provided" };
      }

      const token = authorization.replace("Bearer ", "");
      const decoded = require("../lib/auth").verifyToken(token);

      if (!decoded) {
        set.status = 401;
        return { error: "Invalid token" };
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        set.status = 404;
        return { error: "User not found" };
      }

      return { user };
    } catch (error) {
      set.status = 500;
      return { error: "Failed to get user" };
    }
  });
