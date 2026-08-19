import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Route prefix → allowed roles (empty array = all authenticated users)
const ROUTE_ROLES: Record<string, string[]> = {
  "/admin":                 ["SUPER_ADMIN"],
  "/intermediate":          ["SUPER_ADMIN", "INTER_FACULTY", "PRINCIPAL"],
  "/bs":                    ["SUPER_ADMIN", "BS_CONTROLLER", "BS_FACULTY", "PRINCIPAL", "STUDENT"],
  "/faculty":               ["SUPER_ADMIN", "BS_FACULTY", "INTER_FACULTY"],
  "/student":               ["STUDENT"],
  "/dashboard":             [], // all authenticated
};

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const protectedPrefixes = ["/admin", "/intermediate", "/bs", "/faculty", "/student", "/dashboard"];
  const isProtected = protectedPrefixes.some((p) => path.startsWith(p));

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(loginUrl);
  }

  const userRole = (token.role as string) || "";

  // Super admin has unrestricted access
  if (userRole === "SUPER_ADMIN") return NextResponse.next();

  // Check route restrictions
  for (const [route, allowedRoles] of Object.entries(ROUTE_ROLES)) {
    if (path.startsWith(route)) {
      if (allowedRoles.length === 0) return NextResponse.next();
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/intermediate/:path*",
    "/bs/:path*",
    "/faculty/:path*",
    "/student/:path*",
    "/dashboard/:path*",
  ],
};
