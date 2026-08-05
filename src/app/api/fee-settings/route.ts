import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Default fee structure to seed on first load
const DEFAULT_FEES = [
  { key: "BS_ADMISSION",     label: "BS Admission Fee",          amount: 8500,  category: "BS",           description: "One-time admission processing fee for BS programs" },
  { key: "BS_SEMESTER",      label: "BS Semester Fee",           amount: 3500,  category: "BS",           description: "Per-semester tuition fee for BS students" },
  { key: "BS_EXAM",          label: "BS Examination Fee",        amount: 1500,  category: "BS",           description: "Per-semester examination fee for BS students" },
  { key: "BS_REGISTRATION",  label: "BS Registration Fee",       amount: 500,   category: "BS",           description: "Annual registration/enrollment fee" },
  { key: "INTER_ADMISSION",  label: "Intermediate Admission Fee",amount: 5000,  category: "INTERMEDIATE", description: "One-time admission fee for Intermediate" },
  { key: "INTER_SEMESTER",   label: "Intermediate Semester Fee", amount: 2000,  category: "INTERMEDIATE", description: "Per-semester fee for Intermediate students" },
  { key: "INTER_EXAM",       label: "Intermediate Exam Fee",     amount: 1000,  category: "INTERMEDIATE", description: "Per-semester examination fee" },
  { key: "MIGRATION",        label: "Migration Fee",             amount: 3000,  category: "OTHER",        description: "Fee charged on student migration" },
  { key: "LIBRARY",          label: "Library / Development Fee", amount: 500,   category: "OTHER",        description: "Annual library and development fee" },
];

export async function GET() {
  try {
    let fees = await prisma.feeSettings.findMany({ orderBy: { category: "asc" } });

    // Auto-seed defaults if table is empty
    if (fees.length === 0) {
      await prisma.feeSettings.createMany({ data: DEFAULT_FEES });
      fees = await prisma.feeSettings.findMany({ orderBy: { category: "asc" } });
    }

    return NextResponse.json(fees);
  } catch (error) {
    console.error("Error fetching fee settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, amount, isLocked, description } = await request.json();

    // Check if fee is locked
    const existing = await prisma.feeSettings.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Fee not found" }, { status: 404 });
    if (existing.isLocked && amount !== undefined) {
      return NextResponse.json({ error: "This fee is locked and cannot be modified." }, { status: 403 });
    }

    const updated = await prisma.feeSettings.update({
      where: { id },
      data: {
        ...(amount !== undefined ? { amount: Number(amount) } : {}),
        ...(isLocked !== undefined ? { isLocked } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating fee setting:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
