import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function autoRegisterStudent(admissionId: string) {
  return await prisma.$transaction(async (tx) => {
    const admission = await tx.admission.findUnique({
      where: { id: admissionId },
      include: { program: true }
    });
    if (!admission) throw new Error("Admission not found");
    if (admission.status === "APPROVED") return; // already registered

    // 1. Generate sequential Roll Number using dynamic system settings pattern
    let patternSetting = await tx.systemSetting.findUnique({ where: { key: "ROLL_NUMBER_PATTERN" } });
    if (!patternSetting) {
      await tx.systemSetting.create({ data: { key: "ROLL_NUMBER_PATTERN", value: "[YEAR]-[CODE]-[SEQ]" } });
      patternSetting = await tx.systemSetting.findUnique({ where: { key: "ROLL_NUMBER_PATTERN" } });
    }

    let seqSetting = await tx.systemSetting.findUnique({ where: { key: "ROLL_SEQUENCE_CURRENT" } });
    if (!seqSetting) {
      await tx.systemSetting.create({ data: { key: "ROLL_SEQUENCE_CURRENT", value: "1" } });
      seqSetting = await tx.systemSetting.findUnique({ where: { key: "ROLL_SEQUENCE_CURRENT" } });
    }

    const currentRollSeq = Number(seqSetting?.value || "1");
    const nextRollSeq = currentRollSeq + 1;

    // Update sequence counter in database
    await tx.systemSetting.update({
      where: { key: "ROLL_SEQUENCE_CURRENT" },
      data: { value: String(nextRollSeq) },
    });

    const yearPart = admission.session ? admission.session.slice(-2) : new Date().getFullYear().toString().slice(-2);
    const codePart = admission.program?.code ? admission.program.code.toUpperCase() : admission.educationLevel;
    const sequencePart = String(currentRollSeq).padStart(4, "0");

    const pattern = patternSetting?.value || "[YEAR]-[CODE]-[SEQ]";
    const rollNumber = pattern
      .replace("[YEAR]", yearPart)
      .replace("[CODE]", codePart)
      .replace("[SEQ]", sequencePart);

    // 2. Create User account for student
    const user = await tx.user.create({
      data: {
        email: admission.email,
        name: admission.studentName,
        password: "password123", // default password
        role: "STUDENT",
      }
    });

    // 3. Create Student profile
    const student = await tx.student.create({
      data: {
        userId: user.id,
        rollNumber,
        educationLevel: admission.educationLevel,
        programId: admission.programId,
        groupId: admission.groupId,
        bsAdmissionType: admission.bsAdmissionType,
        currentSemester: admission.educationLevel === "BS" ? 1 : null,
        cnic: admission.cnic,
        fatherName: admission.fatherName,
        contactNumber: admission.contactNumber,
        session: admission.session,
      }
    });

    // 4. Look up configured admission fee from FeeSettings
    const feeKey = admission.educationLevel === "BS" ? "BS_ADMISSION" : "INTER_ADMISSION";
    const feeSetting = await tx.feeSettings.findUnique({ where: { key: feeKey } });
    const feeAmount = feeSetting?.amount ?? (admission.educationLevel === "BS" ? 8500 : 5000);

    // Get sequence settings for Challan number
    let sequenceSetting = await tx.systemSetting.findUnique({ where: { key: "CHALLAN_SEQUENCE_CURRENT" } });
    if (!sequenceSetting) {
      await tx.systemSetting.create({ data: { key: "CHALLAN_SEQUENCE_CURRENT", value: "135622565" } });
      sequenceSetting = await tx.systemSetting.findUnique({ where: { key: "CHALLAN_SEQUENCE_CURRENT" } });
    }
    const currentSequence = Number(sequenceSetting?.value || "135622565");
    await tx.systemSetting.update({
      where: { key: "CHALLAN_SEQUENCE_CURRENT" },
      data: { value: String(currentSequence + 1) },
    });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14 days valid

    // 5. Generate Challan record linked to student & admission
    await tx.challan.create({
      data: {
        challanNumber: String(currentSequence),
        cnic: admission.cnic,
        applicantName: admission.studentName,
        fatherName: admission.fatherName,
        feeType: feeKey,
        feeLabel: feeSetting?.label || "Admission Fee",
        amount: feeAmount,
        dueDate,
        educationLevel: admission.educationLevel,
        semester: admission.educationLevel === "BS" ? 1 : null,
        session: admission.session,
        gender: admission.gender,
        programId: admission.programId,
        admissionId: admission.id,
        studentId: student.id,
        status: "PENDING",
      }
    });

    // 6. Set Admission Status to APPROVED
    await tx.admission.update({
      where: { id: admissionId },
      data: { status: "APPROVED" }
    });
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "ADMIN", "BS_CONTROLLER", "INTER_FACULTY"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await request.json();

    if (!status || !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (status === "APPROVED") {
      await autoRegisterStudent(id);
      return NextResponse.json({ success: true, status: "APPROVED" });
    }

    const updatedAdmission = await prisma.admission.update({
      where: { id },
      data: { status },
    });
    
    return NextResponse.json(updatedAdmission);
  } catch (error: any) {
    console.error("Error updating admission:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "ADMIN", "BS_CONTROLLER", "INTER_FACULTY"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await request.json();

    if (!status || !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (status === "APPROVED") {
      await autoRegisterStudent(id);
      return NextResponse.json({ success: true, status: "APPROVED" });
    }

    const updatedAdmission = await prisma.admission.update({
      where: { id },
      data: { status },
    });
    
    return NextResponse.json(updatedAdmission);
  } catch (error: any) {
    console.error("Error updating admission:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
