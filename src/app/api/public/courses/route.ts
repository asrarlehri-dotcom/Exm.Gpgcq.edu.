import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get("programId");

    if (!programId) {
      return NextResponse.json({ error: "programId is required" }, { status: 400 });
    }

    const courses = await prisma.course.findMany({
      where: {
        programId,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        code: true,
        semester: true,
        creditHours: true,
      },
      orderBy: [
        { semester: "asc" },
        { title: "asc" }
      ],
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching public courses:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
