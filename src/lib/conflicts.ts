import { prisma } from "./prisma";

export async function checkTimetableConflicts({
  facultyId,
  semester,
  programId,
  dayOfWeek,
  startTime,
  endTime,
  excludeTimetableId,
}: {
  facultyId: string;
  semester: number;
  programId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  excludeTimetableId?: string;
}) {
  const errors: string[] = [];

  // Helper to check if two time slots overlap
  // Time format expected: "HH:mm"
  const checkOverlap = (st1: string, et1: string, st2: string, et2: string) => {
    return (st1 < et2 && et1 > st2);
  };

  // 1. Faculty Conflict: Same Faculty + Same Day + Overlapping Time
  const facultyTimetables = await prisma.timetable.findMany({
    where: { facultyId, dayOfWeek, id: { not: excludeTimetableId } }
  });
  
  for (const t of facultyTimetables) {
    if (checkOverlap(startTime, endTime, t.startTime, t.endTime)) {
      errors.push(`Faculty Conflict: Faculty is already assigned to a class from ${t.startTime} to ${t.endTime} on ${dayOfWeek}.`);
      break;
    }
  }

  // 2. Semester Conflict: Same Semester + Same Program + Same Day + Overlapping Time
  const semesterTimetables = await prisma.timetable.findMany({
    where: { programId, semester, dayOfWeek, id: { not: excludeTimetableId } }
  });

  for (const t of semesterTimetables) {
    if (checkOverlap(startTime, endTime, t.startTime, t.endTime)) {
      errors.push(`Semester Conflict: Semester ${semester} already has a class scheduled from ${t.startTime} to ${t.endTime} on ${dayOfWeek}.`);
      break;
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" | "));
  }

  return true;
}


export async function checkDatesheetConflicts({
  semester,
  programId,
  date,
  startTime,
  endTime,
  excludeDatesheetId,
}: {
  semester: number;
  programId: string;
  date: Date;
  startTime: string;
  endTime: string;
  excludeDatesheetId?: string;
}) {
  const errors: string[] = [];

  const checkOverlap = (st1: string, et1: string, st2: string, et2: string) => {
    return (st1 < et2 && et1 > st2);
  };

  // 1. Exam Conflict: Same Semester + Same Program + Same Date + Overlapping Time
  const semesterExams = await prisma.datesheet.findMany({
    where: { programId, semester, date, id: { not: excludeDatesheetId } }
  });

  for (const e of semesterExams) {
    if (checkOverlap(startTime, endTime, e.startTime, e.endTime)) {
      errors.push(`Exam Conflict: Semester ${semester} already has an exam scheduled on this date from ${e.startTime} to ${e.endTime}.`);
      break;
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" | "));
  }

  return true;
}
