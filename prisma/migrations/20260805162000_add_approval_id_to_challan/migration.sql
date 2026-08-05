-- AlterTable
ALTER TABLE "Challan" ADD COLUMN "approvalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Challan_approvalId_key" ON "Challan"("approvalId");
