"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleStudentStatus(id: string, isActive: boolean) {
  await prisma.student.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/students");
}

export async function toggleFacultyStatus(id: string, isActive: boolean) {
  await prisma.faculty.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/faculty");
}

export async function toggleCourseStatus(id: string, isActive: boolean) {
  await prisma.course.update({ where: { id }, data: { isActive } });
  revalidatePath("/bs/courses");
}

export async function getDashboardStats() {
  const syllabusCourses = await prisma.course.count();
  const autoTimetables = await prisma.timetable.count({ where: { generationMode: "AUTO" } });
  const manualTimetables = await prisma.timetable.count({ where: { generationMode: "MANUAL" } });
  const totalTimetables = autoTimetables + manualTimetables;
  
  const autoDatesheets = await prisma.datesheet.count({ where: { generationMode: "AUTO" } });
  const manualDatesheets = await prisma.datesheet.count({ where: { generationMode: "MANUAL" } });
  const publishedDatesheets = await prisma.datesheet.count({ where: { status: "PUBLISHED" } });
  const totalDatesheets = autoDatesheets + manualDatesheets;

  return {
    syllabusCourses,
    totalTimetables,
    autoTimetables,
    manualTimetables,
    totalDatesheets,
    autoDatesheets,
    manualDatesheets,
    publishedDatesheets
  };
}

export async function generateRollNumber(tx: any, admission: {
  educationLevel: string;
  bsAdmissionType?: string | null;
  session?: string | null;
  programId?: string | null;
  program?: { code: string | null } | null;
}) {
  const isBridging = admission.educationLevel === "BS" && admission.bsAdmissionType === "BRIDGING_5TH";
  const isMigration = admission.educationLevel === "BS" && admission.bsAdmissionType === "MIGRATION";
  
  // 1. Fetch all students in the same session and program to extract used sequence IDs
  const sameCohortStudents = await tx.student.findMany({
    where: {
      programId: admission.programId,
      session: admission.session,
    },
    select: { rollNumber: true, bsAdmissionType: true }
  });

  // 2. Filter students and extract their sequence numbers based on isolation rules
  const usedIds = new Set<number>();
  for (const s of sameCohortStudents) {
    if (!s.rollNumber) continue;
    
    const isStudentBridging = s.bsAdmissionType === "BRIDGING_5TH" || s.rollNumber.includes("/Bridge/");
    
    if (isBridging) {
      // For Bridging target: only collect from Bridging students
      if (isStudentBridging) {
        const match = s.rollNumber.match(/:(\d+)$/);
        if (match) usedIds.add(parseInt(match[1], 10));
      }
    } else {
      // For Regular/Migration target: only collect from Regular/Migration students
      if (!isStudentBridging) {
        const match = s.rollNumber.match(/:(\d+)$/);
        if (match) usedIds.add(parseInt(match[1], 10));
      }
    }
  }

  // 3. Find the lowest unused integer starting from 1
  let currentRollSeq = 1;
  while (usedIds.has(currentRollSeq)) {
    currentRollSeq++;
  }

  // 4. Format roll number
  let yearPart = "";
  if (admission.session) {
    const parts = admission.session.split("-");
    const startYear = parts[0].trim();
    yearPart = startYear.slice(-2);
  } else {
    yearPart = new Date().getFullYear().toString().slice(-2);
  }

  const codePart = admission.program?.code ? admission.program.code.toUpperCase() : admission.educationLevel;
  const sequencePart = String(currentRollSeq).padStart(2, "0");
  
  let rollNumber = "";
  if (admission.educationLevel === "BS") {
    if (isBridging) {
      rollNumber = `S-${yearPart}/Bridge/${codePart}:${sequencePart}`;
    } else if (isMigration) {
      rollNumber = `S-${yearPart}/Migration/${codePart}:${sequencePart}`;
    } else {
      rollNumber = `S-${yearPart}/${codePart}:${sequencePart}`;
    }
  } else {
    // Intermediate
    rollNumber = `S-${yearPart}/${codePart}:${sequencePart}`;
  }

  return rollNumber;
}
