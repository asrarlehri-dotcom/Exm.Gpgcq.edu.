import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const departments = await prisma.department.findMany({
    include: { programs: true, _count: { select: { faculty: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(departments);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "SUPER_ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, code, hodName } = await req.json();
    if (!name || !code || !hodName) return NextResponse.json({ error: "Name, code, and HOD name are required" }, { status: 400 });

    const dept = await prisma.department.create({ data: { name, code, hodName } });
    return NextResponse.json(dept, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "SUPER_ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, name, code, hodName } = await req.json();
    if (!id || !name || !code) {
      return NextResponse.json({ error: "ID, name, and code are required" }, { status: 400 });
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        hodName: hodName ? hodName.trim() : null,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating department:", error);
    return NextResponse.json({ error: error.message || "Failed to update department" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "SUPER_ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
    }

    // Soft delete the department
    await prisma.department.update({
      where: { id },
      data: { isActive: false },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any)?.id,
        userEmail: session.user?.email,
        userName: session.user?.name,
        action: "DEACTIVATE",
        entity: "Department",
        entityId: id,
        description: `Department deactivated`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deactivating department:", error);
    return NextResponse.json({ error: error.message || "Failed to deactivate department" }, { status: 500 });
  }
}
