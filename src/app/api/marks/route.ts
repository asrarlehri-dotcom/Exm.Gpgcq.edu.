import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId") || undefined;
    const studentId = searchParams.get("studentId") || undefined;

    const marks = await prisma.marks.findMany({
      where: {
        ...(courseId && { courseId }),
        ...(studentId && { studentId }),
      },
      include: {
        student: { include: { user: true } },
        course: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(marks);
  } catch {
    return NextResponse.json({ error: "Failed to fetch marks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "ADMIN", "FACULTY"].includes((session.user as any)?.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { studentId, courseId, assignmentMarks, quizMarks, midtermMarks, finalMarks, totalMarks } = await req.json();

    if (!studentId || !courseId)
      return NextResponse.json({ error: "studentId and courseId required" }, { status: 400 });

    const assignment = parseFloat(assignmentMarks || 0);
    const quiz = parseFloat(quizMarks || 0);
    const midterm = parseFloat(midtermMarks || 0);
    const final = parseFloat(finalMarks || 0);
    const obtained = assignment + quiz + midterm + final;
    const total = parseFloat(totalMarks || 100);

    // Upsert — update if exists, create if not
    const existing = await prisma.marks.findFirst({ where: { studentId, courseId } });

    const marksRecord = existing
      ? await prisma.marks.update({
          where: { id: existing.id },
          data: { assignmentMarks: assignment, quizMarks: quiz, midtermMarks: midterm, finalMarks: final, obtainedMarks: obtained, totalMarks: total },
          include: { student: { include: { user: true } }, course: true },
        })
      : await prisma.marks.create({
          data: { studentId, courseId, assignmentMarks: assignment, quizMarks: quiz, midtermMarks: midterm, finalMarks: final, obtainedMarks: obtained, totalMarks: total },
          include: { student: { include: { user: true } }, course: true },
        });

    return NextResponse.json(marksRecord, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to save marks" }, { status: 500 });
  }
}
