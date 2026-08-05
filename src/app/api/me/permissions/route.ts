import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPermissionsForRole } from "@/lib/permissions";

// GET /api/me/permissions — returns permission map for current user's role
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role ?? "GUEST";
    const permissions = await getPermissionsForRole(role);
    return NextResponse.json({ role, permissions });
  } catch {
    return NextResponse.json({ role: "GUEST", permissions: {} });
  }
}
