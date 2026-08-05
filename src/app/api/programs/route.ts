import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const programs = await prisma.program.findMany({
      include: {
        groups: {
          include: {
            subjects: true,
          }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json(programs);
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, educationLevel } = await request.json();

    if (!name || !educationLevel) {
      return NextResponse.json({ error: "Name and Education Level are required" }, { status: 400 });
    }

    const program = await prisma.program.create({
      data: {
        name,
        educationLevel,
      },
    });
    
    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error("Error creating program:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
