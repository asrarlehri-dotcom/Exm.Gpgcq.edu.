import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "ADMIN", "BS_CONTROLLER"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { studentId, statusType, reason } = await req.json();

    if (!studentId || !statusType) {
      return NextResponse.json({ error: "Fields missing" }, { status: 400 });
    }

    // Log the status
    const statusRecord = await prisma.studentStatus.create({
      data: {
        studentId,
        statusType,
        reason,
        approvedBy: session.user?.name || "Staff",
      },
    });

    // If student quits or migrates out, set active status to false
    if (statusType === "QUIT" || statusType === "MIGRATION") {
      await prisma.student.update({
        where: { id: studentId },
        data: { isActive: false },
      });
    } else if (statusType === "FREEZE") {
      // Freezing semester could keep active status true or false depending on policy
      // Usually, they are not currently taking classes
      await prisma.student.update({
        where: { id: studentId },
        data: { isActive: false },
      });
    }

    return NextResponse.json({ success: true, statusRecord });
  } catch (err) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
