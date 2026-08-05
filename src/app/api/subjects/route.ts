import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, code, groupId } = await request.json();

    if (!name || !groupId) {
      return NextResponse.json({ error: "Name and Group ID are required" }, { status: 400 });
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        code: code || null,
        groupId,
      },
    });
    
    return NextResponse.json(subject, { status: 201 });
  } catch (error) {
    console.error("Error creating subject:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
