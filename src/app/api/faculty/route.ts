import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "ADMIN", "BS_CONTROLLER"].includes((session.user as any)?.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const faculty = await prisma.faculty.findMany({
      include: { user: true, department: true, courses: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(faculty);
  } catch {
    return NextResponse.json({ error: "Failed to fetch faculty" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any)?.role))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, email, password, fatherName, designation, qualification, contactNumber, departmentId, educationLevel } = await req.json();
    if (!name || !email || !password)
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: "FACULTY" },
    });

    const faculty = await prisma.faculty.create({
      data: {
        userId: user.id,
        fatherName: fatherName || null,
        designation: designation || null,
        qualification: qualification || null,
        contactNumber: contactNumber || null,
        departmentId: departmentId || null,
        educationLevel: educationLevel || "BS",
      } as any,
      include: { user: true, department: true },
    });

    await prisma.auditLog.create({
      data: {
        userEmail: session.user?.email, userName: session.user?.name,
        action: "CREATE", entity: "Faculty", entityId: faculty.id,
        description: `Faculty "${name}" (${designation || 'Faculty Member'}) registered`,
      },
    });

    return NextResponse.json(faculty, { status: 201 });
  } catch (error: any) {
    console.error("Create faculty error:", error);
    return NextResponse.json({ error: "Failed to register faculty member" }, { status: 500 });
  }
}
