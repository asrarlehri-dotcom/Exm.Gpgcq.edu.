import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "ADMIN", "BS_CONTROLLER"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
