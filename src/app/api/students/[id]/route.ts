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

    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // Clean up related records
      await tx.studentStatus.deleteMany({ where: { studentId: id } });
      await tx.promotion.deleteMany({ where: { studentId: id } });
      await tx.fee.deleteMany({ where: { studentId: id } });
      await tx.challan.updateMany({ where: { studentId: id }, data: { studentId: null } });
      await tx.attendance.deleteMany({ where: { studentId: id } });
      await tx.enrollment.deleteMany({ where: { studentId: id } });
      await tx.marks.deleteMany({ where: { studentId: id } });
      await tx.result.deleteMany({ where: { studentId: id } });

      // Delete the student record
      await tx.student.delete({ where: { id } });

      // Decrement sequence setting if the deleted student was the latest sequence
      if (student.rollNumber) {
        const match = student.rollNumber.match(/:(\d+)$/);
        if (match) {
          const deletedSeq = parseInt(match[1], 10);
          const seqSetting = await tx.systemSetting.findUnique({ where: { key: "ROLL_SEQUENCE_CURRENT" } });
          if (seqSetting) {
            const currentSeqVal = Number(seqSetting.value);
            if (deletedSeq + 1 === currentSeqVal) {
              await tx.systemSetting.update({
                where: { key: "ROLL_SEQUENCE_CURRENT" },
                data: { value: String(deletedSeq) }
              });
            }
          }
        }
      }

      // Delete the user record
      if (student.userId) {
        await tx.user.delete({ where: { id: student.userId } });
      }
    });

    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email, userName: session.user?.name,
        action: "DELETE", entity: "Student", entityId: id,
        description: `Student "${student.user?.name}" (${student.rollNumber}) deleted`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete student error:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
