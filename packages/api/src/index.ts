import "dotenv/config";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { authRoutes } from "./routes/auth";
import { campaignRoutes } from "./routes/campaigns";
import { couponRoutes } from "./routes/coupons";
import { redemptionRoutes } from "./routes/redemption";

const PORT = process.env.PORT || 3000;

const app = new Elysia()
  .use(cors())
  .get("/", () => ({
    message: "Coupon Management API",
    version: "1.0.0",
    endpoints: {
      auth: "/auth",
      campaigns: "/campaigns",
      coupons: "/coupons",
      redemption: "/redemption",
    },
  }))
  .get("/health", () => ({ status: "ok", timestamp: new Date().toISOString() }))
  .use(authRoutes)
  .use(campaignRoutes)
  .use(couponRoutes)
  .use(redemptionRoutes)
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
