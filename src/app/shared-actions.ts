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
