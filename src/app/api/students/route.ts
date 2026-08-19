import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      !["SUPER_ADMIN", "ADMIN", "FACULTY", "BS_FACULTY", "INTER_FACULTY", "TEACHER", "BS_CONTROLLER"].includes(
        (session.user as any)?.role
      )
    )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const educationLevel = searchParams.get("educationLevel") || undefined;
    const programId = searchParams.get("programId") || undefined;
    const sessionParam = searchParams.get("session") || undefined;
    const courseId = searchParams.get("courseId") || undefined; // New: filter by enrollment

    // ── Enrollment-based filtering ───────────────────────────────────────────
    // When courseId is provided, return ONLY students enrolled in that course.
    // This is used by the marks entry page to show the correct student list.
    if (courseId) {
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId, status: "ACTIVE" },
        include: {
          student: {
            include: { user: true, program: true, group: true, statuses: true },
          },
        },
        orderBy: { createdAt: "asc" },
      });
      const students = enrollments.map((e) => e.student);
      return NextResponse.json(students);
    }

    // ── Standard filter (no courseId) ────────────────────────────────────────
    const students = await prisma.student.findMany({
      where: {
        ...(educationLevel && { educationLevel }),
        ...(programId && { programId }),
        ...(sessionParam && sessionParam !== "ALL" && {
          OR: [
            { session: sessionParam },
            { session: { contains: sessionParam } },
          ],
        }),
      },
      include: {
        user: true,
        program: true,
        group: true,
        statuses: true,
        marks: {
          include: {
            course: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(students);
  } catch {
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any)?.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, email, password, rollNumber, educationLevel, programId, groupId, currentSemester, bsAdmissionType } = await req.json();

    if (!name || !email || !password || !rollNumber || !educationLevel)
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

    const existingRoll = await prisma.student.findUnique({ where: { rollNumber } });
    if (existingRoll) return NextResponse.json({ error: "Roll number already exists" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { name, email, password: hashed, role: "STUDENT" } });

    const student = await prisma.student.create({
      data: {
        userId: user.id, rollNumber, educationLevel,
        programId: programId || null, groupId: groupId || null,
        currentSemester: currentSemester ? parseInt(currentSemester) : null,
        bsAdmissionType: bsAdmissionType || null,
      },
      include: { user: true, program: true, group: true },
    });

    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email, userName: session.user?.name,
        action: "CREATE", entity: "Student", entityId: student.id,
        description: `Student "${name}" (${rollNumber}) registered`,
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to register student" }, { status: 500 });
  }
}
