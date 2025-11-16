import "dotenv/config";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth";
import { campaignRoutes } from "./routes/campaigns";
import { couponRoutes } from "./routes/coupons";
import { redemptionRoutes } from "./routes/redemption";
import { dashboardRoutes } from "./routes/dashboard";

const PORT = process.env.PORT || 3000;

const app = new Elysia()
  .use(cors({
    origin: [
      'https://coupons-admin.demo.nexmindit.com',
      'https://coupons-staff.demo.nexmindit.com',
      'http://coupons-admin.demo.nexmindit.com',
      'http://coupons-staff.demo.nexmindit.com',
      'http://localhost:5173', // Keep for local development
    ],
    credentials: true
  }))
  .get("/", () => ({
    message: "Coupon Management API",
    version: "1.0.0",
    endpoints: {
      auth: "/auth",
      campaigns: "/campaigns",
      coupons: "/coupons",
      redemption: "/redemption",
      dashboard: "/dashboard",
    },
  }))
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .use(authRoutes)
  .use(campaignRoutes)
  .use(couponRoutes)
  .use(redemptionRoutes)
  .use(dashboardRoutes)
  .onError(({ code, error, set }) => {
    console.error("Error:", code, error);
    set.status = 500;
    return {
      error: "Internal server error",
      message: error.message,
    };
  })
  .listen(PORT);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
