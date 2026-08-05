import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { admissionId } = await request.json();

    if (!admissionId) {
      return NextResponse.json({ error: "Admission ID is required" }, { status: 400 });
    }

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId }
    });

    if (!admission) {
      return NextResponse.json({ error: "Admission not found" }, { status: 404 });
    }

    if (admission.status !== "APPROVED") {
      return NextResponse.json({ error: "Admission must be approved first" }, { status: 400 });
    }

    // Check if student already exists for this admission
    const existingStudent = await prisma.student.findUnique({
      where: { rollNumber: `ROLL-${admission.cnic}` } // Simplified logic for demo
    });

    if (existingStudent) {
      return NextResponse.json({ error: "Student is already registered" }, { status: 400 });
    }

    // Wrap in a transaction to ensure both user, student, and fee are created
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User account for student
      const user = await tx.user.create({
        data: {
          email: admission.email,
          name: admission.studentName,
          password: "password123", // default password
          role: "STUDENT",
        }
      });

      // 2. Create Student profile
      const student = await tx.student.create({
        data: {
          userId: user.id,
          rollNumber: `ROLL-${Math.floor(Math.random() * 10000)}`,
          educationLevel: admission.educationLevel,
          programId: admission.programId,
          groupId: admission.groupId,
          bsAdmissionType: admission.bsAdmissionType,
          currentSemester: admission.educationLevel === "BS" ? 1 : null,
        }
      });

      // 3. Generate initial admission fee challan
      const feeAmount = admission.educationLevel === "BS" ? 50000 : 25000;
      
      const fee = await tx.fee.create({
        data: {
          studentId: student.id,
          amount: feeAmount,
          dueDate: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          challanNumber: `CHL-${Date.now()}`,
          status: "UNPAID",
        }
      });

      return { student, fee, user };
    });
    
    return NextResponse.json({ success: true, result }, { status: 201 });
  } catch (error) {
    console.error("Error registering student:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
