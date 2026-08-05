import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Generates a Paid ID e.g. PAID-20260805-A3X9K
function generatePaidId(): string {
  const date = new Date();
  const ymd =
    date.getFullYear().toString() +
    String(date.getMonth() + 1).padStart(2, "0") +
    String(date.getDate()).padStart(2, "0");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  const rand = Array.from({ length: 5 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `PAID-${ymd}-${rand}`;
}

// PATCH /api/challans/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { status, remarks } = await request.json();
    if (!["PAID", "REJECTED", "PENDING"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const existing = await prisma.challan.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Generate paidId only when marking PAID (and not already assigned)
    const paidId =
      status === "PAID" && !existing.paidId
        ? generatePaidId()
        : status === "PAID"
          ? existing.paidId   // keep the existing one if already set
          : null;             // clear if un-paying

    const challan = await prisma.challan.update({
      where: { id },
      data: {
        status,
        remarks: remarks || null,
        paidAt: status === "PAID" ? new Date() : null,
        paidId: paidId,
      },
    });

    return NextResponse.json(challan);
  } catch (error) {
    console.error("Error updating challan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET /api/challans/[id]
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        admission: { select: { id: true, status: true } },
        student: { select: { id: true, rollNumber: true } },
        program: { select: { id: true, name: true, code: true } },
      },
    });
    if (!challan) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(challan);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
