/*
  Warnings:

  - You are about to drop the `campaigns` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `coupons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `redemption_logs` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('FUEL', 'BOAT');

-- DropForeignKey
ALTER TABLE "coupons" DROP CONSTRAINT "coupons_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "redemption_logs" DROP CONSTRAINT "redemption_logs_couponId_fkey";

-- DropForeignKey
ALTER TABLE "redemption_logs" DROP CONSTRAINT "redemption_logs_userId_fkey";

-- DropTable
DROP TABLE "campaigns";

-- DropTable
DROP TABLE "coupons";

-- DropTable
DROP TABLE "redemption_logs";

-- DropEnum
DROP TYPE "CouponStatus";

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "WalletType" NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "qrToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topup_logs" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amountAdded" DOUBLE PRECISION NOT NULL,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topup_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_logs" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amountDeducted" DOUBLE PRECISION NOT NULL,
    "durationMinutes" INTEGER,
    "staffId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_qrToken_key" ON "wallets"("qrToken");

-- CreateIndex
CREATE INDEX "wallets_companyId_idx" ON "wallets"("companyId");

-- CreateIndex
CREATE INDEX "wallets_qrToken_idx" ON "wallets"("qrToken");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_companyId_type_key" ON "wallets"("companyId", "type");

-- CreateIndex
CREATE INDEX "topup_logs_walletId_idx" ON "topup_logs"("walletId");

-- CreateIndex
CREATE INDEX "topup_logs_adminId_idx" ON "topup_logs"("adminId");

-- CreateIndex
CREATE INDEX "usage_logs_walletId_idx" ON "usage_logs"("walletId");

-- CreateIndex
CREATE INDEX "usage_logs_staffId_idx" ON "usage_logs"("staffId");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topup_logs" ADD CONSTRAINT "topup_logs_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topup_logs" ADD CONSTRAINT "topup_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
