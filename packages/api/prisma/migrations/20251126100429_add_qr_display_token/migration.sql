/*
  Warnings:

  - A unique constraint covering the columns `[qrDisplayToken]` on the table `wallets` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "wallets" ADD COLUMN     "qrDisplayToken" TEXT,
ADD COLUMN     "qrDisplayTokenExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_qrDisplayToken_key" ON "wallets"("qrDisplayToken");

-- CreateIndex
CREATE INDEX "wallets_qrDisplayToken_idx" ON "wallets"("qrDisplayToken");

-- CreateIndex
CREATE INDEX "wallets_qrDisplayTokenExpiry_idx" ON "wallets"("qrDisplayTokenExpiry");
