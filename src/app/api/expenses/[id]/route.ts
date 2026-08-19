import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkPermission, MODULES, ACTIONS } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const role = (session.user as any).role;
    const canView = await checkPermission(role, MODULES.ADMIN_EXPENSES, ACTIONS.VIEW);
    if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const expense = await prisma.expense.findUnique({
      where: { id, isActive: true },
      include: { department: true }
    });

    if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const role = (session.user as any).role;
    const canEdit = await checkPermission(role, MODULES.ADMIN_EXPENSES, ACTIONS.EDIT);
    if (!canEdit) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { category, date, description, amount, vendorPayee, paymentMethod, departmentId, session: academicSession, receipt, status } = body;

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        category,
        date: date ? new Date(date) : undefined,
        description,
        amount: amount ? parseFloat(amount) : undefined,
        vendorPayee,
        paymentMethod,
        departmentId,
        session: academicSession,
        receipt,
        status,
        updatedBy: session.user?.email || "unknown",
      }
    });

    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const role = (session.user as any).role;
    const canDelete = await checkPermission(role, MODULES.ADMIN_EXPENSES, ACTIONS.DELETE);
    if (!canDelete) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Financial Records -> Soft Delete
    await prisma.expense.update({
      where: { id, isActive: true },
      data: { isActive: false, updatedBy: session.user?.email || "unknown" }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
