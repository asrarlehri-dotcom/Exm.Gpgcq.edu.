import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const programs = await prisma.program.findMany({
      include: {
        department: true,
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

    const { name, code, educationLevel, departmentId } = await request.json();

    if (!name || !code || !educationLevel) {
      return NextResponse.json({ error: "Name, Code, and Education Level are required" }, { status: 400 });
    }

    const program = await prisma.program.create({
      data: {
        name,
        code,
        educationLevel,
        departmentId: departmentId || null,
      },
    });
    
    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error("Error creating program:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, code, educationLevel, departmentId } = await request.json();

    if (!id || !name || !code || !educationLevel) {
      return NextResponse.json({ error: "ID, Name, Code, and Education Level are required" }, { status: 400 });
    }

    const updated = await prisma.program.update({
      where: { id },
      data: {
        name,
        code: code.trim().toUpperCase(),
        educationLevel,
        departmentId: departmentId || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating program:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID parameter" }, { status: 400 });
    }

    // Soft delete the program by setting isActive to false
    await prisma.program.update({
      where: { id },
      data: { isActive: false },
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: (session.user as any)?.id,
        userEmail: session.user?.email,
        userName: session.user?.name,
        action: "DEACTIVATE",
        entity: "Program",
        entityId: id,
        description: `Program deactivated`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deactivating program:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
