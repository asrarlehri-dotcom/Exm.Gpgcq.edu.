import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "ADMIN", "FACULTY", "BS_FACULTY", "INTER_FACULTY", "TEACHER", "BS_CONTROLLER"].includes((session.user as any)?.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId") || undefined;
    const studentId = searchParams.get("studentId") || undefined;
    const semester = searchParams.get("semester");

    const enrollments = await prisma.enrollment.findMany({
      where: {
        ...(courseId && { courseId }),
        ...(studentId && { studentId }),
        ...(semester && { semester: parseInt(semester) }),
      },
      include: {
        student: { include: { user: true } },
        course: { include: { program: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(enrollments);
  } catch {
    return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any)?.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { studentId, courseId, semester } = await req.json();
    if (!studentId || !courseId || !semester)
      return NextResponse.json({ error: "studentId, courseId and semester required" }, { status: 400 });

    // Check duplicate
    const existing = await prisma.enrollment.findFirst({ where: { studentId, courseId } });
    if (existing) return NextResponse.json({ error: "Student already enrolled in this course" }, { status: 400 });

    const enrollment = await prisma.enrollment.create({
      data: { studentId, courseId, semester: parseInt(semester) },
      include: { student: { include: { user: true } }, course: true },
    });
    return NextResponse.json(enrollment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to enroll student" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any)?.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    await prisma.enrollment.update({ where: { id }, data: { status: "DROPPED" } });
    
    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any)?.id,
        userEmail: session.user?.email,
        userName: session.user?.name,
        action: "UPDATE",
        entity: "Enrollment",
        entityId: id,
        description: `Enrollment marked as DROPPED`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error dropping enrollment:", error);
    return NextResponse.json({ error: "Failed to delete enrollment" }, { status: 500 });
  }
}
