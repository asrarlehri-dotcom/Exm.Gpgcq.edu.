import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** DELETE /api/attendance/[id] — delete a single attendance record */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const record = await prisma.attendance.findUnique({ where: { id } });
    if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.attendance.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("DELETE attendance error:", e);
    return NextResponse.json({ error: e.message || "Failed to delete attendance record" }, { status: 500 });
  }
}

/** PATCH /api/attendance/[id] — update a single attendance record's status */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { status } = await req.json();
    if (!status || !["PRESENT", "ABSENT", "LEAVE"].includes(status))
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });

    const updated = await prisma.attendance.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error("PATCH attendance error:", e);
    return NextResponse.json({ error: e.message || "Failed to update attendance record" }, { status: 500 });
  }
}
