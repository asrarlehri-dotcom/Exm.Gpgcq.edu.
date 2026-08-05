"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkTimetableConflicts, checkDatesheetConflicts } from "@/lib/conflicts";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIMETABLE_SLOTS = [
  { start: "09:00", end: "10:00" },
  { start: "10:00", end: "11:00" },
  { start: "11:00", end: "12:00" },
  { start: "12:00", end: "13:00" },
  { start: "13:00", end: "14:00" }
];

export async function getFilterData() {
  const programs = await prisma.program.findMany({ where: { isActive: true } });
  const departments = await prisma.department.findMany({ where: { isActive: true } });
  const faculties = await prisma.faculty.findMany({ where: { isActive: true }, include: { user: true } });
  return { programs, departments, faculties, rooms: [] };
}

export async function getTimetables(
  session?: string,
  programId?: string,
  semester?: number,
  departmentId?: string
) {
  return prisma.timetable.findMany({
    where: {
      ...(session ? { session } : {}),
      ...(programId ? { programId } : {}),
      ...(semester ? { semester } : {}),
      ...(departmentId ? { departmentId } : {}),
    },
    include: { course: true, faculty: { include: { user: true } }, program: true },
    orderBy: [{ session: 'desc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }]
  });
}

export async function generateTimetable(session: string, programId: string, departmentId: string, semester: number) {
  // Clear existing auto-generated drafts
  await prisma.timetable.deleteMany({
    where: { session, programId, semester, status: "DRAFT" }
  });

  const courses = await prisma.course.findMany({
    where: { session, programId, departmentId, semester, isActive: true },
    include: { faculty: true }
  });

  const generatedEntries = [];
  const errors: string[] = [];

  for (const course of courses) {
    if (!course.facultyId) {
      errors.push(`Course ${course.title} has no assigned faculty.`);
      continue;
    }

    // Try to find a slot
    let slotFound = false;
    for (const day of DAYS) {
      if (slotFound) break;
      for (const slot of TIMETABLE_SLOTS) {
        try {
          await checkTimetableConflicts({
            facultyId: course.facultyId,
            semester,
            programId,
            dayOfWeek: day,
            startTime: slot.start,
            endTime: slot.end
          });

          // If no conflict, create entry
          const entry = await prisma.timetable.create({
            data: {
              session,
              programId,
              departmentId,
              semester,
              courseId: course.id,
              facultyId: course.facultyId,
              dayOfWeek: day,
              startTime: slot.start,
              endTime: slot.end,
              generationMode: "AUTO",
              status: "DRAFT"
            }
          });
          generatedEntries.push(entry);
          slotFound = true;
          break;
        } catch (e: any) {
          // Conflict found, try next slot
          continue;
        }
      }
    }

    if (!slotFound) {
      errors.push(`Could not find a conflict-free slot for ${course.title}.`);
    }
  }

  revalidatePath("/bs/timetable-datesheet");
  return { success: true, errors };
}

export async function saveManualTimetable(data: any) {
  const { roomId, ...timetableData } = data;
  try {
    await checkTimetableConflicts({
      facultyId: timetableData.facultyId,
      semester: timetableData.semester,
      programId: timetableData.programId,
      dayOfWeek: timetableData.dayOfWeek,
      startTime: timetableData.startTime,
      endTime: timetableData.endTime,
      excludeTimetableId: timetableData.id
    });

    if (timetableData.id) {
      await prisma.timetable.update({ where: { id: timetableData.id }, data: timetableData });
    } else {
      await prisma.timetable.create({ data: { ...timetableData, generationMode: "MANUAL", status: "DRAFT" } });
    }
    revalidatePath("/bs/timetable-datesheet");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function publishTimetable(session: string, programId: string, semester: number) {
  await prisma.timetable.updateMany({
    where: { session, programId, semester, status: "DRAFT" },
    data: { status: "PUBLISHED" }
  });
  revalidatePath("/bs/timetable-datesheet");
}

export async function deleteTimetableEntry(id: string) {
  await prisma.timetable.delete({ where: { id } });
  revalidatePath("/bs/timetable-datesheet");
}

// ---------------- DATESHEET ----------------

const EXAM_DATES = [
  new Date("2026-06-04"),
  new Date("2026-06-05"),
  new Date("2026-06-06"),
  new Date("2026-06-08"),
  new Date("2026-06-09")
];
const EXAM_SLOT = { start: "09:00", end: "12:00" };

export async function getDatesheets(
  session?: string,
  programId?: string,
  semester?: number,
  examType?: string,
  departmentId?: string
) {
  return prisma.datesheet.findMany({
    where: {
      ...(session ? { session } : {}),
      ...(programId ? { programId } : {}),
      ...(semester ? { semester } : {}),
      ...(examType ? { examType } : {}),
      ...(departmentId ? { departmentId } : {}),
    },
    include: { course: true, program: true },
    orderBy: [{ session: 'desc' }, { date: 'asc' }, { startTime: 'asc' }]
  });
}

export async function generateDatesheet(session: string, programId: string, departmentId: string, semester: number, examType: string, examSession: string) {
  // Clear existing auto-generated drafts
  await prisma.datesheet.deleteMany({
    where: { session, programId, semester, examType, status: "DRAFT" }
  });

  // Source of truth: Timetable
  const timetableEntries = await prisma.timetable.findMany({
    where: { session, programId, semester, status: "PUBLISHED" },
    include: { course: true }
  });

  const uniqueCourseIds = Array.from(new Set(timetableEntries.filter(t => t.courseId).map(t => t.courseId)));
  const errors: string[] = [];

  let dateIndex = 0;

  for (const courseId of uniqueCourseIds) {
    const courseTimetables = timetableEntries.filter(t => t.courseId === courseId);

    if (dateIndex >= EXAM_DATES.length) {
      errors.push(`Not enough exam dates available for course ${courseTimetables[0].course?.title}.`);
      continue;
    }

    const assignedDate = EXAM_DATES[dateIndex];
    dateIndex++;

    try {
      await checkDatesheetConflicts({
        semester,
        programId,
        date: assignedDate,
        startTime: EXAM_SLOT.start,
        endTime: EXAM_SLOT.end
      });

      await prisma.datesheet.create({
        data: {
          session,
          programId,
          departmentId,
          semester,
          examType,
          examSession,
          timetableId: courseTimetables[0].id,
          courseId: courseId as string,
          date: assignedDate,
          startTime: EXAM_SLOT.start,
          endTime: EXAM_SLOT.end,
          generationMode: "AUTO",
          status: "DRAFT"
        }
      });
    } catch (e: any) {
      errors.push(`Conflict mapping course ${courseTimetables[0].course?.title}: ${e.message}`);
    }
  }

  revalidatePath("/bs/timetable-datesheet");
  return { success: true, errors };
}

export async function publishDatesheet(session: string, programId: string, semester: number, examType: string) {
  await prisma.datesheet.updateMany({
    where: { session, programId, semester, examType, status: "DRAFT" },
    data: { status: "PUBLISHED" }
  });
  revalidatePath("/bs/timetable-datesheet");
}

export async function deleteDatesheetEntry(id: string) {
  await prisma.datesheet.delete({ where: { id } });
  revalidatePath("/bs/timetable-datesheet");
}
