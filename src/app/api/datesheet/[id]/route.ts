import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** PATCH /api/datesheet/[id] — edit a datesheet entry */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (
      !session ||
      !["SUPER_ADMIN", "BS_CONTROLLER", "PRINCIPAL"].includes(
        (session.user as any)?.role
      )
    )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      date, startTime, endTime, examType, examSession,
      courseId, programId, departmentId, semester,
      session: sess, status, generationMode,
    } = body;

    const entry = await prisma.datesheet.findUnique({ where: { id } });
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (entry.isFinalized)
      return NextResponse.json(
        { error: "Cannot edit a finalized datesheet entry. Un-finalize first." },
        { status: 400 }
      );

    const updated = await prisma.datesheet.update({
      where: { id },
      data: {
        ...(date !== undefined && { date: new Date(date) }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(examType !== undefined && { examType }),
        ...(examSession !== undefined && { examSession: examSession || null }),
        ...(courseId !== undefined && { courseId: courseId || null }),
        ...(programId !== undefined && { programId: programId || null }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
        ...(semester !== undefined && { semester: semester ? parseInt(semester) : null }),
        ...(sess !== undefined && { session: sess }),
        ...(status !== undefined && { status }),
        ...(generationMode !== undefined && { generationMode }),
      },
      include: { course: true, program: true },
    });

    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email,
        userName: session.user?.name,
        action: "UPDATE",
        entity: "Datesheet",
        entityId: id,
        description: `Datesheet entry updated (${updated.examType} — ${updated.date.toDateString()})`,
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH datesheet error:", e);
    return NextResponse.json({ error: e.message || "Failed to update datesheet entry" }, { status: 500 });
  }
}

/** DELETE /api/datesheet/[id] — soft delete a datesheet entry */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (
      !session ||
      !["SUPER_ADMIN", "BS_CONTROLLER"].includes((session.user as any)?.role)
    )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const entry = await prisma.datesheet.findUnique({ where: { id } });
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (entry.isFinalized)
      return NextResponse.json(
        { error: "Cannot delete a finalized datesheet entry. Un-finalize first." },
        { status: 400 }
      );

    // Cascade: remove associated exam duties
    await prisma.$transaction(async (tx) => {
      await tx.examDuty.deleteMany({ where: { datesheetId: id } });
      await tx.datesheet.update({ where: { id }, data: { isActive: false } });
    });

    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email,
        userName: session.user?.name,
        action: "DELETE",
        entity: "Datesheet",
        entityId: id,
        description: `Datesheet entry deleted (${entry.examType} — ${entry.date.toDateString()})`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("DELETE datesheet error:", e);
    return NextResponse.json({ error: e.message || "Failed to delete datesheet entry" }, { status: 500 });
  }
}
