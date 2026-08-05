/*
  Warnings:

  - You are about to drop the `Room` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `roomId` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `roomId` on the `Datesheet` table. All the data in the column will be lost.
  - You are about to drop the column `roomId` on the `Timetable` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Room_name_key";

-- AlterTable
ALTER TABLE "Admission" ADD COLUMN "migrationSemester" INTEGER;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Room";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "creditHours" INTEGER NOT NULL,
    "courseType" TEXT NOT NULL DEFAULT 'THEORY',
    "session" TEXT NOT NULL DEFAULT '2022',
    "semester" INTEGER NOT NULL,
    "programId" TEXT NOT NULL,
    "departmentId" TEXT,
    "facultyId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Course_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Course_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Course_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Course" ("code", "courseType", "createdAt", "creditHours", "departmentId", "facultyId", "id", "isActive", "programId", "semester", "session", "title", "updatedAt") SELECT "code", "courseType", "createdAt", "creditHours", "departmentId", "facultyId", "id", "isActive", "programId", "semester", "session", "title", "updatedAt" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
CREATE TABLE "new_Datesheet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session" TEXT NOT NULL DEFAULT '2022',
    "semester" INTEGER,
    "examType" TEXT NOT NULL DEFAULT 'FINAL_TERM',
    "examSession" TEXT,
    "date" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "generationMode" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "timetableId" TEXT,
    "courseId" TEXT,
    "programId" TEXT,
    "departmentId" TEXT,
    "examId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Datesheet_timetableId_fkey" FOREIGN KEY ("timetableId") REFERENCES "Timetable" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Datesheet_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Datesheet_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Datesheet_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Datesheet" ("courseId", "createdAt", "date", "departmentId", "endTime", "examId", "examSession", "examType", "generationMode", "id", "programId", "semester", "session", "startTime", "status", "timetableId", "updatedAt") SELECT "courseId", "createdAt", "date", "departmentId", "endTime", "examId", "examSession", "examType", "generationMode", "id", "programId", "semester", "session", "startTime", "status", "timetableId", "updatedAt" FROM "Datesheet";
DROP TABLE "Datesheet";
ALTER TABLE "new_Datesheet" RENAME TO "Datesheet";
CREATE TABLE "new_Timetable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session" TEXT NOT NULL DEFAULT '2022',
    "semester" INTEGER,
    "dayOfWeek" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "educationLevel" TEXT,
    "generationMode" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "courseId" TEXT,
    "facultyId" TEXT,
    "programId" TEXT,
    "departmentId" TEXT,
    "classSectionId" TEXT,
    "subjectId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Timetable_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Timetable_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Timetable_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Timetable_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Timetable" ("classSectionId", "courseId", "createdAt", "dayOfWeek", "departmentId", "educationLevel", "endTime", "facultyId", "generationMode", "id", "programId", "semester", "session", "startTime", "status", "subjectId", "updatedAt") SELECT "classSectionId", "courseId", "createdAt", "dayOfWeek", "departmentId", "educationLevel", "endTime", "facultyId", "generationMode", "id", "programId", "semester", "session", "startTime", "status", "subjectId", "updatedAt" FROM "Timetable";
DROP TABLE "Timetable";
ALTER TABLE "new_Timetable" RENAME TO "Timetable";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
