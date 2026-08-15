import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId") || undefined;
    const programId = searchParams.get("programId") || undefined;
    const semester = searchParams.get("semester") ? parseInt(searchParams.get("semester")!) : undefined;
    const session = searchParams.get("session") || undefined;

    const datesheets = await prisma.datesheet.findMany({
      where: {
        ...(courseId && { courseId }),
        ...(programId && { programId }),
        ...(semester && { semester }),
        ...(session && { session }),
      },
      include: {
        course: true,
        program: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(datesheets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch datesheets" }, { status: 500 });
  }
}
