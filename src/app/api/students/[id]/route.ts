import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await prisma.student.findUnique({
    where: { id },
    include: { user: true, program: true, group: true, enrollments: { include: { course: true } } },
  });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(student);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any)?.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { currentSemester, programId, groupId, isActive, rollNumber } = await req.json();

    const student = await prisma.student.update({
      where: { id },
      data: {
        ...(currentSemester !== undefined && { currentSemester: parseInt(currentSemester) }),
        ...(programId !== undefined && { programId: programId || null }),
        ...(groupId !== undefined && { groupId: groupId || null }),
        ...(isActive !== undefined && { isActive }),
        ...(rollNumber !== undefined && { rollNumber }),
      },
      include: { user: true, program: true, group: true },
    });
    return NextResponse.json(student);
  } catch {
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "SUPER_ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Soft delete
    const student = await prisma.student.update({
      where: { id },
      data: { isActive: false },
      include: { user: true },
    });

    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email, userName: session.user?.name,
        action: "DELETE", entity: "Student", entityId: id,
        description: `Student "${student.user?.name}" (${student.rollNumber}) deactivated`,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
