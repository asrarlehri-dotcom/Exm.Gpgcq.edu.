import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fees = await prisma.fee.findMany({
      include: {
        student: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(fees);
  } catch (error) {
    console.error("Error fetching fees:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
