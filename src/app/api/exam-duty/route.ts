import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET: fetch duties filtered by datesheetId, programId, session, semester, examType
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const datesheetId = searchParams.get("datesheetId") || undefined;
    const programId = searchParams.get("programId") || undefined;
    const sess = searchParams.get("session") || undefined;
    const semester = searchParams.get("semester");
    const examType = searchParams.get("examType") || undefined;

    // If specific datesheetId, return duties for that paper
    if (datesheetId) {
      const duties = await prisma.examDuty.findMany({
        where: { datesheetId },
        include: { faculty: { include: { user: true } }, datesheet: { include: { course: true } } },
        orderBy: [{ isMandatory: "desc" }, { createdAt: "asc" }],
      });
      return NextResponse.json(duties);
    }

    // Otherwise query via datesheet filters
    const datesheets = await prisma.datesheet.findMany({
      where: {
        ...(programId && programId !== "ALL" ? { programId } : {}),
        ...(sess && sess !== "ALL" ? { session: sess } : {}),
        ...(semester && semester !== "0" ? { semester: parseInt(semester) } : {}),
        ...(examType && examType !== "ALL" ? { examType } : {}),
        isFinalized: true,
      },
      select: { id: true },
    });

    const datesheetIds = datesheets.map((d) => d.id);

    const duties = await prisma.examDuty.findMany({
      where: { datesheetId: { in: datesheetIds } },
      include: {
        faculty: { include: { user: true } },
        datesheet: { include: { course: true, program: true } },
      },
      orderBy: [{ datesheet: { date: "asc" } }, { isMandatory: "desc" }],
    });

    return NextResponse.json(duties);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to fetch duties" }, { status: 500 });
  }
}

// POST: create or update a duty entry (manual)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      !["SUPER_ADMIN", "BS_CONTROLLER", "PRINCIPAL"].includes((session.user as any)?.role)
    )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, datesheetId, facultyId, dutyType, isMandatory, room, shiftTime, notes, isOverride } =
      await req.json();

    if (!datesheetId || !facultyId)
      return NextResponse.json({ error: "datesheetId and facultyId are required" }, { status: 400 });

    // Check if this faculty already has a duty on the same date (conflict detection)
    const ds = await prisma.datesheet.findUnique({ where: { id: datesheetId } });
    if (!ds) return NextResponse.json({ error: "Datesheet entry not found" }, { status: 404 });

    if (!isOverride) {
      // Check if faculty already assigned to another paper on the same date & time overlap
      const conflict = await prisma.examDuty.findFirst({
        where: {
          facultyId,
          NOT: id ? { id } : undefined,
          datesheet: { date: ds.date },
        },
        include: { datesheet: { include: { course: true } } },
      });
      if (conflict) {
        return NextResponse.json({
          error: `Conflict: Faculty is already assigned on ${ds.date.toLocaleDateString()} for ${conflict.datesheet?.course?.title || "another paper"}. Set isOverride=true to force.`,
          conflict: true,
        }, { status: 409 });
      }
    }

    let duty;
    if (id) {
      duty = await prisma.examDuty.update({
        where: { id },
        data: { facultyId, dutyType: dutyType || "INVIGILATOR", isMandatory: Boolean(isMandatory), room, shiftTime, notes, isOverride: Boolean(isOverride) },
        include: { faculty: { include: { user: true } }, datesheet: { include: { course: true } } },
      });
    } else {
      // Upsert by unique constraint [datesheetId, facultyId]
      const existing = await prisma.examDuty.findUnique({
        where: { datesheetId_facultyId: { datesheetId, facultyId } },
      });
      if (existing) {
        duty = await prisma.examDuty.update({
          where: { id: existing.id },
          data: { dutyType: dutyType || existing.dutyType, isMandatory: isMandatory !== undefined ? Boolean(isMandatory) : existing.isMandatory, room, shiftTime, notes, isOverride: Boolean(isOverride) },
          include: { faculty: { include: { user: true } }, datesheet: { include: { course: true } } },
        });
      } else {
        duty = await prisma.examDuty.create({
          data: { datesheetId, facultyId, dutyType: dutyType || "INVIGILATOR", isMandatory: Boolean(isMandatory), room, shiftTime, notes, isOverride: Boolean(isOverride) },
          include: { faculty: { include: { user: true } }, datesheet: { include: { course: true } } },
        });
      }
    }

    return NextResponse.json(duty, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to save duty" }, { status: 500 });
  }
}

// DELETE: remove a duty entry
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session ||
      !["SUPER_ADMIN", "BS_CONTROLLER", "PRINCIPAL"].includes((session.user as any)?.role)
    )
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.examDuty.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Failed to delete duty" }, { status: 500 });
  }
}
