import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "BS_CONTROLLER"];
const FACULTY_ROLES = ["BS_FACULTY", "INTER_FACULTY", "FACULTY", "TEACHER", "PRINCIPAL"];

/**
 * Get the Faculty record for the currently logged-in user.
 * Returns null if the user is not a faculty member.
 */
async function getFacultyForSession(sessionUser: any) {
  if (!sessionUser?.id) return null;
  return prisma.faculty.findUnique({ where: { userId: sessionUser.id } });
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId") || undefined;
    const studentId = searchParams.get("studentId") || undefined;
    const userRole = (session.user as any)?.role || "";

    // ── Backend faculty restriction ──────────────────────────────────────────
    // If the user is BS_FACULTY (or similar), they can ONLY access marks for
    // courses where Course.facultyId === their Faculty.id
    if (FACULTY_ROLES.includes(userRole) && !ADMIN_ROLES.includes(userRole)) {
      const faculty = await getFacultyForSession(session.user);
      if (!faculty)
        return NextResponse.json({ error: "Faculty profile not found" }, { status: 403 });

      // If a specific courseId is requested, verify it belongs to this faculty
      if (courseId) {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course || course.facultyId !== faculty.id)
          return NextResponse.json({ error: "Access denied: This course is not assigned to you." }, { status: 403 });
      }

      // Fetch marks only for courses assigned to this faculty
      const facultyCourseIds = await prisma.course
        .findMany({ where: { facultyId: faculty.id }, select: { id: true } })
        .then((cs) => cs.map((c) => c.id));

      const marks = await prisma.marks.findMany({
        where: {
          courseId: { in: facultyCourseIds },
          ...(courseId && { courseId }),
          ...(studentId && { studentId }),
        },
        include: {
          student: { include: { user: true } },
          course: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(marks);
    }

    // Admin/Controller — no restriction
    const marks = await prisma.marks.findMany({
      where: {
        ...(courseId && { courseId }),
        ...(studentId && { studentId }),
      },
      include: {
        student: { include: { user: true } },
        course: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(marks);
  } catch {
    return NextResponse.json({ error: "Failed to fetch marks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      !([...ADMIN_ROLES, ...FACULTY_ROLES]).includes((session.user as any)?.role)
    )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      studentId,
      courseId,
      assignmentMarks,
      quizMarks,
      practicalMarks,
      midtermMarks,
      finalMarks,
      totalMarks,
      status,
      isLocked,
    } = await req.json();

    if (!studentId || !courseId)
      return NextResponse.json({ error: "studentId and courseId required" }, { status: 400 });

    const userRole = (session.user as any)?.role || "";
    const isAdmin = ADMIN_ROLES.includes(userRole);

    // ── Backend faculty restriction ──────────────────────────────────────────
    if (!isAdmin) {
      const faculty = await getFacultyForSession(session.user);
      if (!faculty)
        return NextResponse.json({ error: "Faculty profile not found" }, { status: 403 });

      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course || course.facultyId !== faculty.id)
        return NextResponse.json({ error: "Access denied: This course is not assigned to you." }, { status: 403 });

      // ── Date-gate: Result entry opens 1 day after exam date ──────────────
      // Check for a finalized datesheet entry for this course
      const datesheetEntry = await prisma.datesheet.findFirst({
        where: { courseId, isFinalized: true },
        orderBy: { date: "desc" },
      });

      if (datesheetEntry) {
        const examDate = new Date(datesheetEntry.date);
        const unlockDate = new Date(examDate);
        unlockDate.setDate(unlockDate.getDate() + 1);
        unlockDate.setHours(0, 0, 0, 0);

        const now = new Date();
        if (now < unlockDate) {
          const hoursLeft = Math.ceil((unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60));
          return NextResponse.json({
            error: `Result entry is locked until 1 day after the exam (${unlockDate.toLocaleDateString()}). Opens in ~${hoursLeft} hour(s).`,
            locked: true,
            unlockDate: unlockDate.toISOString(),
            examDate: examDate.toISOString(),
          }, { status: 403 });
        }
      }
    }

    const assignment = parseFloat(assignmentMarks || 0);
    const quiz = parseFloat(quizMarks || 0);
    const practical = parseFloat(practicalMarks || 0);
    const midterm = parseFloat(midtermMarks || 0);
    const final = parseFloat(finalMarks || 0);
    const obtained = assignment + quiz + practical + midterm + final;
    const total = parseFloat(totalMarks || 100);

    const dataPayload: any = {
      assignmentMarks: assignment,
      quizMarks: quiz,
      practicalMarks: practical,
      midtermMarks: midterm,
      finalMarks: final,
      obtainedMarks: obtained,
      totalMarks: total,
      ...(isLocked !== undefined && { isLocked: Boolean(isLocked) }),
    };

    const existing = await prisma.marks.findFirst({ where: { studentId, courseId } });

    const marksRecord = existing
      ? await prisma.marks.update({
          where: { id: existing.id },
          data: dataPayload,
          include: { student: { include: { user: true } }, course: true },
        })
      : await prisma.marks.create({
          data: { studentId, courseId, ...dataPayload },
          include: { student: { include: { user: true } }, course: true },
        });

    if (status !== undefined) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "Marks" SET "status" = ? WHERE "id" = ?`,
          String(status),
          marksRecord.id
        );
        (marksRecord as any).status = status;
      } catch {
        // Ignored if column doesn't exist
      }
    }

    return NextResponse.json(marksRecord, { status: 200 });
  } catch (error: any) {
    console.error("Save marks error:", error);
    return NextResponse.json({ error: error.message || "Failed to save marks" }, { status: 500 });
  }
}
