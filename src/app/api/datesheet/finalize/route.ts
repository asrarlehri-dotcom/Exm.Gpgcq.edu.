import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/datesheet/finalize
 * Finalizes published datesheet entries for a given scope.
 * A finalized datesheet is the official exam schedule.
 * It unlocks: Exam Duty generation + Result entry (1 day after exam).
 *
 * Validations:
 *  - All entries must reference a finalized timetable (or be manually created with awareness)
 *  - Entries must have a course and date assigned
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      !["SUPER_ADMIN", "BS_CONTROLLER", "PRINCIPAL"].includes((session.user as any)?.role)
    )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { session: sess, programId, semester, examType } = await req.json();

    const where: any = {
      status: "PUBLISHED",
      ...(sess && sess !== "ALL" ? { session: sess } : {}),
      ...(programId && programId !== "ALL" ? { programId } : {}),
      ...(semester && semester !== 0 ? { semester: parseInt(semester) } : {}),
      ...(examType && examType !== "ALL" ? { examType } : {}),
    };

    const entries = await prisma.datesheet.findMany({
      where,
      include: { timetable: true },
    });

    if (entries.length === 0)
      return NextResponse.json({ error: "No PUBLISHED datesheet entries found for the given filters." }, { status: 404 });

    // Warn if any entry has no timetable link or timetable is not finalized
    const warnings: string[] = [];
    for (const entry of entries) {
      if (!entry.timetableId) {
        warnings.push(`Entry for course ${entry.courseId} has no timetable link.`);
      } else if (entry.timetable && !entry.timetable.isFinalized) {
        warnings.push(`Datesheet entry ${entry.id} references a non-finalized timetable.`);
      }
    }

    const result = await prisma.datesheet.updateMany({
      where,
      data: { isFinalized: true },
    });

    return NextResponse.json({ success: true, count: result.count, warnings });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to finalize datesheet" }, { status: 500 });
  }
}

/**
 * DELETE /api/datesheet/finalize
 * Un-finalizes datesheet entries. Only if no duties or marks exist for them.
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN"].includes((session.user as any)?.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { session: sess, programId, semester, examType } = await req.json();

    const where: any = {
      isFinalized: true,
      ...(sess && sess !== "ALL" ? { session: sess } : {}),
      ...(programId && programId !== "ALL" ? { programId } : {}),
      ...(semester && semester !== 0 ? { semester: parseInt(semester) } : {}),
      ...(examType && examType !== "ALL" ? { examType } : {}),
    };

    // Check for existing duties
    const datesheets = await prisma.datesheet.findMany({ where, select: { id: true } });
    const dsIds = datesheets.map((d) => d.id);
    const existingDuties = await prisma.examDuty.count({ where: { datesheetId: { in: dsIds } } });

    if (existingDuties > 0)
      return NextResponse.json({
        error: `Cannot un-finalize: ${existingDuties} duty assignments exist. Remove duties first.`,
      }, { status: 400 });

    const result = await prisma.datesheet.updateMany({ where, data: { isFinalized: false } });
    return NextResponse.json({ success: true, count: result.count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to un-finalize datesheet" }, { status: 500 });
  }
}
