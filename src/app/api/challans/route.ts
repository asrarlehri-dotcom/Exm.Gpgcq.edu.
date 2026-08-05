import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateChallanNumber(): string {
  const ts = Date.now().toString().slice(-8);
  const rand = Math.floor(Math.random() * 900 + 100);
  return `CHL-${ts}-${rand}`;
}

// GET /api/challans?status=PENDING&educationLevel=BS
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const educationLevel = searchParams.get("educationLevel");
    const cnic = searchParams.get("cnic");

    const challans = await prisma.challan.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(educationLevel ? { educationLevel } : {}),
        ...(cnic ? { cnic } : {}),
      },
      include: {
        admission: { select: { id: true, status: true, programId: true } },
        student:   { select: { id: true, rollNumber: true } },
        program:   { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(challans);
  } catch (error) {
    console.error("Error fetching challans:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/challans — Generate a new challan
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      cnic,
      applicantName,
      fatherName,
      feeType,
      educationLevel,
      semester,
      session,
      particulars,
      gender,
      programId,
      daysValid = 7,
    } = body;

    if (!cnic || !applicantName || !feeType || !educationLevel) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Lookup fee amount from FeeSettings
    const feeSetting = await prisma.feeSettings.findUnique({ where: { key: feeType } });
    if (!feeSetting) {
      return NextResponse.json({ error: "Invalid fee type" }, { status: 400 });
    }

    // ── Get and Increment Challan Sequence ──
    let sequenceSetting = await prisma.systemSetting.findUnique({ where: { key: "CHALLAN_SEQUENCE_CURRENT" } });
    if (!sequenceSetting) {
      // Seed if missing
      await prisma.systemSetting.create({ data: { key: "CHALLAN_SEQUENCE_CURRENT", value: "135622565" } });
      sequenceSetting = await prisma.systemSetting.findUnique({ where: { key: "CHALLAN_SEQUENCE_CURRENT" } });
    }
    const currentSequence = Number(sequenceSetting?.value || "135622565");
    const nextSequence = currentSequence + 1;

    // Update sequence in DB
    await prisma.systemSetting.update({
      where: { key: "CHALLAN_SEQUENCE_CURRENT" },
      data: { value: String(nextSequence) },
    });

    const challanNumber = String(currentSequence);

    // Try to link to existing Admission record by CNIC
    const admission = await prisma.admission.findUnique({ where: { cnic } });

    // Try to link to existing Student record by CNIC
    const student = await prisma.student.findFirst({ where: { cnic } });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Number(daysValid));

    const challan = await prisma.challan.create({
      data: {
        challanNumber,
        cnic,
        applicantName,
        fatherName: fatherName || null,
        feeType,
        feeLabel: feeSetting.label,
        amount: feeSetting.amount,
        dueDate,
        educationLevel,
        semester: semester ? Number(semester) : null,
        session: session || null,
        particulars: particulars || feeSetting.label,
        gender: gender || null,
        programId: programId || null,
        admissionId: admission?.id || null,
        studentId:   student?.id   || null,
        status: "PENDING",
      },
    });

    return NextResponse.json(challan, { status: 201 });
  } catch (error) {
    console.error("Error creating challan:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
