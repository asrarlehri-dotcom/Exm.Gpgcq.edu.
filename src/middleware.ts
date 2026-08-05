import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Route prefix → allowed roles (empty array = all authenticated users)
// SUPER_ADMIN always passes every check
const ROUTE_ROLES: Record<string, string[]> = {
  "/admin":                 ["SUPER_ADMIN"],
  "/intermediate":          ["SUPER_ADMIN", "INTER_FACULTY", "PRINCIPAL"],
  "/bs":                    ["SUPER_ADMIN", "BS_CONTROLLER", "BS_FACULTY", "PRINCIPAL", "STUDENT"],
  "/faculty":               ["SUPER_ADMIN", "BS_FACULTY", "INTER_FACULTY"],
  "/student":               ["STUDENT"],
  "/dashboard":             [], // all authenticated
};

export default withAuth(
  function middleware(req) {
    const token   = req.nextauth.token;
    const path    = req.nextUrl.pathname;

    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const userRole = token.role as string;

    // Super admin has unrestricted access
    if (userRole === "SUPER_ADMIN") return NextResponse.next();

    // Check route restrictions
    for (const [route, allowedRoles] of Object.entries(ROUTE_ROLES)) {
      if (path.startsWith(route)) {
        if (allowedRoles.length === 0) return NextResponse.next(); // any authenticated
        if (!allowedRoles.includes(userRole)) {
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
        return NextResponse.next();
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Only require token for protected routes (public pages bypass this)
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        const protectedPrefixes = ["/admin", "/intermediate", "/bs", "/faculty", "/student", "/dashboard"];
        const isProtected = protectedPrefixes.some(p => path.startsWith(p));
        if (!isProtected) return true; // public route
        return !!token;
      },
    },
  }
);

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
