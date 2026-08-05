import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const programId = searchParams.get("programId") || undefined;
    const semester = searchParams.get("semester");
    const session_year = searchParams.get("session") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;

    const courses = await prisma.course.findMany({
      where: {
        ...(programId && { programId }),
        ...(semester && { semester: parseInt(semester) }),
        ...(session_year && { session: session_year }),
        ...(departmentId && { departmentId }),
      },
      include: { program: true, department: true, faculty: { include: { user: true } } },
      orderBy: [{ semester: "asc" }, { title: "asc" }],
    });
    return NextResponse.json(courses);
  } catch {
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any)?.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, code, creditHours, courseType, session: sess, semester, programId, departmentId, facultyId } = await req.json();

    if (!title || !code || !creditHours || !semester || !programId)
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });

    const course = await prisma.course.create({
      data: {
        title, code, creditHours: parseInt(creditHours),
        courseType: courseType || "THEORY",
        session: sess || "2026",
        semester: parseInt(semester),
        programId,
        departmentId: departmentId || null,
        facultyId: facultyId || null,
      },
      include: { program: true, faculty: { include: { user: true } } },
    });

    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email, userName: session.user?.name,
        action: "CREATE", entity: "Course", entityId: course.id,
        description: `Course "${title}" (${code}) created for Semester ${semester}`,
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
