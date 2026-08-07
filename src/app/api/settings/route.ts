import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const DEFAULT_SETTINGS = [
  { key: "CHALLAN_BANK_ACCOUNT", value: "08730001324203" },
  { key: "CHALLAN_SEQUENCE_START", value: "100000" },
  { key: "CHALLAN_SEQUENCE_CURRENT", value: "135622565" },
  { key: "ROLL_NUMBER_PATTERN", value: "[YEAR]-[CODE]-[SEQ]" },
  { key: "ROLL_SEQUENCE_CURRENT", value: "1" },
  { key: "ACADEMIC_SESSIONS", value: "2022,2023,2024,2025,2026,2027" },
];

export async function GET() {
  try {
    // Ensure all default settings are seeded
    for (const item of DEFAULT_SETTINGS) {
      await prisma.systemSetting.upsert({
        where: { key: item.key },
        update: {},
        create: item,
      });
    }

    const settings = await prisma.systemSetting.findMany();

    // Convert array of settings to a simple key-value object
    const config = settings.reduce<Record<string, string>>((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return NextResponse.json(config);
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json(); // expected e.g. { CHALLAN_BANK_ACCOUNT: "...", CHALLAN_SEQUENCE_START: "..." }

    for (const [key, value] of Object.entries(body)) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving system settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
