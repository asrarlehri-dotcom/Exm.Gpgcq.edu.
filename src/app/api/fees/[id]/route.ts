import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, MODULES, ACTIONS } from "@/lib/permissions";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const role = (session.user as any).role;
    const canEdit = await checkPermission(role, MODULES.BS_FEES, ACTIONS.EDIT);
    if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { status } = await request.json();

    if (!status || !["UNPAID", "PAID"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedFee = await prisma.fee.update({
      where: { id },
      data: { status },
    });
    
    return NextResponse.json(updatedFee);
  } catch (error) {
    console.error("Error updating fee:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const role = (session.user as any).role;
    const canDelete = await checkPermission(role, MODULES.BS_FEES, ACTIONS.DELETE);
    if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Financial Records -> Soft Delete Matrix implemented here
    await prisma.fee.update({
      where: { id },
      data: { isActive: false },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting fee:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
