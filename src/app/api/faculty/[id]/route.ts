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

    const { departmentId, isActive } = await req.json();
    const faculty = await prisma.faculty.update({
      where: { id },
      data: {
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { user: true, department: true },
    });
    return NextResponse.json(faculty);
  } catch {
    return NextResponse.json({ error: "Failed to update faculty" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "SUPER_ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const faculty = await prisma.faculty.findUnique({ where: { id }, include: { user: true } });
    if (!faculty) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Soft delete: deactivate instead of hard delete to preserve references
    await prisma.faculty.update({ where: { id }, data: { isActive: false } });

    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email, userName: session.user?.name,
        action: "DELETE", entity: "Faculty", entityId: id,
        description: `Faculty "${faculty.user?.name}" deactivated`,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete faculty" }, { status: 500 });
  }
}
