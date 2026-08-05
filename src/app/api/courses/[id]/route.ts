import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "ADMIN", "BS_CONTROLLER"].includes((session.user as any)?.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.code && { code: data.code }),
        ...(data.creditHours && { creditHours: parseInt(data.creditHours) }),
        ...(data.courseType && { courseType: data.courseType }),
        ...(data.semester && { semester: parseInt(data.semester) }),
        ...(data.facultyId !== undefined && { facultyId: data.facultyId || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: { program: true, faculty: { include: { user: true } } },
    });
    return NextResponse.json(course);
  } catch {
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "SUPER_ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await prisma.course.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
