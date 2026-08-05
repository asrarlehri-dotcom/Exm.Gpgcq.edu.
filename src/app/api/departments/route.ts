import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const departments = await prisma.department.findMany({
    include: { programs: true, _count: { select: { faculty: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(departments);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "SUPER_ADMIN")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, code, hodName } = await req.json();
    if (!name || !code) return NextResponse.json({ error: "Name and code required" }, { status: 400 });

    const dept = await prisma.department.create({ data: { name, code, hodName: hodName || null } });
    return NextResponse.json(dept, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create department" }, { status: 500 });
  }
}
