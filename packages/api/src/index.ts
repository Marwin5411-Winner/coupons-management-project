import "dotenv/config";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth";
import { companyRoutes } from "./routes/companies";
import { walletRoutes } from "./routes/wallets";
import { topupRoutes } from "./routes/topup";
import { usageRoutes } from "./routes/usage";
import { dashboardRoutes } from "./routes/dashboard";

const PORT = process.env.PORT || 3000;

const app = new Elysia()
  .use(cors({
    origin: [
      'https://coupons-admin.demo.nexmindit.com',
      'https://coupons-staff.demo.nexmindit.com',
      'http://coupons-admin.demo.nexmindit.com',
      'http://coupons-staff.demo.nexmindit.com',
      'http://localhost:5173', // Admin web
      'http://localhost:5174', // Staff web
      'http://localhost:5175', // Client web
    ],
    credentials: true
  }))
  .get("/", () => ({
    message: "Fuel & Boat Coupon Management API",
    version: "2.0.0",
    endpoints: {
      auth: "/auth",
      companies: "/companies",
      wallets: "/wallets",
      topup: "/topup",
      usage: "/usage",
      dashboard: "/dashboard",
    },
  }))
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .use(authRoutes)
  .use(companyRoutes)
  .use(walletRoutes)
  .use(topupRoutes)
  .use(usageRoutes)
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
  `🦊 Fuel & Boat Coupon API is running at ${app.server?.hostname}:${app.server?.port}`
);
