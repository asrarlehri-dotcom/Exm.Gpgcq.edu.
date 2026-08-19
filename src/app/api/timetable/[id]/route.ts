import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** PATCH /api/timetable/[id] — edit a timetable entry */
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
      dayOfWeek, startTime, endTime, courseId,
      facultyId, semester, session: sess,
      programId, departmentId, status,
      generationMode, classSectionId, subjectId,
    } = body;

    const entry = await prisma.timetable.findUnique({ where: { id } });
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (entry.isFinalized)
      return NextResponse.json(
        { error: "Cannot edit a finalized timetable entry. Un-finalize first." },
        { status: 400 }
      );

    const updated = await prisma.timetable.update({
      where: { id },
      data: {
        ...(dayOfWeek !== undefined && { dayOfWeek }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(courseId !== undefined && { courseId: courseId || null }),
        ...(facultyId !== undefined && { facultyId: facultyId || null }),
        ...(semester !== undefined && { semester: semester ? parseInt(semester) : null }),
        ...(sess !== undefined && { session: sess }),
        ...(programId !== undefined && { programId: programId || null }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
        ...(status !== undefined && { status }),
        ...(generationMode !== undefined && { generationMode }),
        ...(classSectionId !== undefined && { classSectionId: classSectionId || null }),
        ...(subjectId !== undefined && { subjectId: subjectId || null }),
      },
      include: {
        course: true,
        faculty: { include: { user: true } },
        program: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email,
        userName: session.user?.name,
        action: "UPDATE",
        entity: "Timetable",
        entityId: id,
        description: `Timetable entry updated (${updated.dayOfWeek} ${updated.startTime}–${updated.endTime})`,
      },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH timetable error:", e);
    return NextResponse.json({ error: e.message || "Failed to update timetable entry" }, { status: 500 });
  }
}

/** DELETE /api/timetable/[id] — soft delete a timetable entry */
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

    const entry = await prisma.timetable.findUnique({ where: { id } });
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (entry.isFinalized)
      return NextResponse.json(
        { error: "Cannot delete a finalized timetable entry. Un-finalize first." },
        { status: 400 }
      );

    await prisma.timetable.update({ where: { id }, data: { isActive: false } });

    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email,
        userName: session.user?.name,
        action: "DELETE",
        entity: "Timetable",
        entityId: id,
        description: `Timetable entry deleted (${entry.dayOfWeek} ${entry.startTime}–${entry.endTime})`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("DELETE timetable error:", e);
    return NextResponse.json({ error: e.message || "Failed to delete timetable entry" }, { status: 500 });
  }
}
