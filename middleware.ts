import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const pwd = process.env.ADMIN_PASSWORD || "";
  const url = req.nextUrl;

  // If password not set, block access (safer than open admin).
  if (!pwd) {
    return new NextResponse("Admin password not configured", { status: 500 });
  }

  const given = url.searchParams.get("pwd") || req.cookies.get("admin_pwd")?.value || "";

  // If password matches -> set cookie and allow
  if (given === pwd) {
    const res = NextResponse.next();
    res.cookies.set("admin_pwd", pwd, {
      httpOnly: true,
      sameSite: "lax",
      path: "/admin",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  }

  // Otherwise show a tiny login page (no redirect loops)
  return new NextResponse(
    `Admin locked. Open: /admin?pwd=YOUR_PASSWORD`,
    { status: 401 }
  );
}

// Only run middleware on /admin routes
export const config = {
  matcher: ["/admin/:path*"],
};
