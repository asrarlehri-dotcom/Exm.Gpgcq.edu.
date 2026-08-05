/*
  Warnings:

  - You are about to drop the column `approvalId` on the `Challan` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Challan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challanNumber" TEXT NOT NULL,
    "cnic" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "fatherName" TEXT,
    "feeType" TEXT NOT NULL,
    "feeLabel" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "particulars" TEXT,
    "educationLevel" TEXT,
    "semester" INTEGER,
    "session" TEXT,
    "paidAt" DATETIME,
    "paidId" TEXT,
    "remarks" TEXT,
    "gender" TEXT,
    "programId" TEXT,
    "admissionId" TEXT,
    "studentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Challan_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Challan_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Challan_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Challan" ("admissionId", "amount", "applicantName", "challanNumber", "cnic", "createdAt", "dueDate", "educationLevel", "fatherName", "feeLabel", "feeType", "id", "paidAt", "particulars", "remarks", "semester", "session", "status", "studentId", "updatedAt") SELECT "admissionId", "amount", "applicantName", "challanNumber", "cnic", "createdAt", "dueDate", "educationLevel", "fatherName", "feeLabel", "feeType", "id", "paidAt", "particulars", "remarks", "semester", "session", "status", "studentId", "updatedAt" FROM "Challan";
DROP TABLE "Challan";
ALTER TABLE "new_Challan" RENAME TO "Challan";
CREATE UNIQUE INDEX "Challan_challanNumber_key" ON "Challan"("challanNumber");
CREATE UNIQUE INDEX "Challan_paidId_key" ON "Challan"("paidId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
