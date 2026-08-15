import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// PATCH /api/admin/users/[id] — update role
// PATCH /api/admin/users/[id] — update role
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { role } = await req.json();
  const VALID_ROLES = ["SUPER_ADMIN", "ADMIN", "FACULTY", "STUDENT", "BS_CONTROLLER", "BS_FACULTY", "INTER_FACULTY", "PRINCIPAL"];
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  // Log the action
  await prisma.auditLog.create({
    data: {
      userId: (session.user as any)?.id,
      userEmail: session.user?.email,
      userName: session.user?.name,
      action: "UPDATE",
      entity: "User",
      entityId: id,
      description: `Role changed to "${role}" for user ${updated.email}`,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/admin/users/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.user.update({ where: { id }, data: { isActive: false } });

  // Log the action
  await prisma.auditLog.create({
    data: {
      userId: (session.user as any)?.id,
      userEmail: session.user?.email,
      userName: session.user?.name,
      action: "DEACTIVATE",
      entity: "User",
      entityId: id,
      description: `User "${user.email}" deactivated`,
    },
  });

  return NextResponse.json({ success: true });
}
