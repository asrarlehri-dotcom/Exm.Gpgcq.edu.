import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      studentName, 
      fatherName, 
      cnic, 
      dateOfBirth, 
      contactNumber, 
      email, 
      educationLevel,
      programId,
      groupId,
      bsAdmissionType,
      migrationSemester,
      session,
      gender,
      sscGroup,
      sscObtained,
      sscTotal,
      sscYear,
      sscBoard,
      hsscGroup,
      hsscObtained,
      hsscTotal,
      hsscYear,
      hsscBoard,
    } = data;

    if (!studentName || !fatherName || !cnic || !dateOfBirth || !contactNumber || !email || !educationLevel) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Basic validation
    const existingAdmissionByCnic = await prisma.admission.findUnique({
      where: { cnic }
    });
    if (existingAdmissionByCnic) {
      return NextResponse.json({ error: "Admission with this CNIC already exists" }, { status: 400 });
    }

    const existingAdmissionByEmail = await prisma.admission.findUnique({
      where: { email }
    });
    if (existingAdmissionByEmail) {
      return NextResponse.json({ error: "Admission with this Email address already exists" }, { status: 400 });
    }

    const admission = await prisma.admission.create({
      data: {
        studentName,
        fatherName,
        cnic,
        dateOfBirth: new Date(dateOfBirth),
        contactNumber,
        email,
        educationLevel,
        programId: programId || null,
        groupId: groupId || null,
        bsAdmissionType: bsAdmissionType || null,
        migrationSemester: bsAdmissionType === "MIGRATION" ? (migrationSemester ?? null) : null,
        session: session || null,
        gender: gender || null,
        sscGroup: sscGroup || null,
        sscObtained: sscObtained ? Number(sscObtained) : null,
        sscTotal: sscTotal ? Number(sscTotal) : null,
        sscYear: sscYear ? Number(sscYear) : null,
        sscBoard: sscBoard || "BBISE QUETTA",
        hsscGroup: hsscGroup || null,
        hsscObtained: hsscObtained ? Number(hsscObtained) : null,
        hsscTotal: hsscTotal ? Number(hsscTotal) : null,
        hsscYear: hsscYear ? Number(hsscYear) : null,
        hsscBoard: hsscBoard || "BBISE QUETTA",
      },
    });
    
    return NextResponse.json({ success: true, admission }, { status: 201 });
  } catch (error) {
    console.error("Error submitting admission:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const educationLevel = searchParams.get("educationLevel");

    const admissions = await prisma.admission.findMany({
      where: educationLevel ? { educationLevel } : undefined,
      include: {
        program: { select: { name: true } },
        group:   { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch all matched students by CNIC
    const cnics = admissions.map(a => a.cnic);
    const students = await prisma.student.findMany({
      where: { cnic: { in: cnics } },
      select: { cnic: true, rollNumber: true }
    });

    const studentMap = students.reduce<Record<string, string>>((acc, s) => {
      acc[s.cnic] = s.rollNumber;
      return acc;
    }, {});

    // Attach rollNumber to admissions payload
    const resAdmissions = admissions.map((a: any) => ({
      ...a,
      rollNumber: studentMap[a.cnic] || null
    }));

    return NextResponse.json(resAdmissions);
  } catch (error) {
    console.error("Error fetching admissions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
