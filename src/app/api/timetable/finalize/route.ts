import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/timetable/finalize
 * Finalizes published timetable entries for a given scope.
 * A finalized timetable is the prerequisite for datesheet generation.
 *
 * Validations:
 *  - All entries must have status = "PUBLISHED"
 *  - All entries must have a facultyId assigned
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      !["SUPER_ADMIN", "BS_CONTROLLER", "PRINCIPAL"].includes((session.user as any)?.role)
    )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { session: sess, programId, semester } = await req.json();

    const where: any = {
      status: "PUBLISHED",
      ...(sess && sess !== "ALL" ? { session: sess } : {}),
      ...(programId && programId !== "ALL" ? { programId } : {}),
      ...(semester && semester !== 0 ? { semester: parseInt(semester) } : {}),
    };

    // Fetch entries to validate
    const entries = await prisma.timetable.findMany({ where });

    if (entries.length === 0)
      return NextResponse.json({ error: "No PUBLISHED timetable entries found for the given filters." }, { status: 404 });

    // Check all have faculty
    const missing = entries.filter((e) => !e.facultyId);
    if (missing.length > 0) {
      return NextResponse.json({
        error: `${missing.length} timetable entries have no faculty assigned. Please assign faculty to all entries before finalizing.`,
        missingCount: missing.length,
      }, { status: 400 });
    }

    // Finalize
    const result = await prisma.timetable.updateMany({
      where,
      data: { isFinalized: true },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to finalize timetable" }, { status: 500 });
  }
}

/**
 * DELETE /api/timetable/finalize
 * Un-finalizes timetable entries (reverts to PUBLISHED, non-finalized state).
 * Only allowed if no finalized datesheets exist for the same scope.
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      !["SUPER_ADMIN"].includes((session.user as any)?.role)
    )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { session: sess, programId, semester } = await req.json();

    const where: any = {
      isFinalized: true,
      ...(sess && sess !== "ALL" ? { session: sess } : {}),
      ...(programId && programId !== "ALL" ? { programId } : {}),
      ...(semester && semester !== 0 ? { semester: parseInt(semester) } : {}),
    };

    // Check if any finalized datesheets depend on these timetables
    const dependentDatesheets = await prisma.datesheet.findMany({
      where: {
        isFinalized: true,
        ...(sess && sess !== "ALL" ? { session: sess } : {}),
        ...(programId && programId !== "ALL" ? { programId } : {}),
        ...(semester && semester !== 0 ? { semester: parseInt(semester) } : {}),
      },
    });

    if (dependentDatesheets.length > 0)
      return NextResponse.json({
        error: `Cannot un-finalize timetable: ${dependentDatesheets.length} finalized datesheets depend on it. Un-finalize the datesheet first.`,
      }, { status: 400 });

    const result = await prisma.timetable.updateMany({ where, data: { isFinalized: false } });
    return NextResponse.json({ success: true, count: result.count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to un-finalize timetable" }, { status: 500 });
  }
}
