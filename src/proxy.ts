import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // We check for the session via an HTTP request to the Better Auth route handler
  // This avoids importing Node.js specific libraries (like pg) into Edge middleware.
  const authUrl = new URL("/api/auth/get-session", request.nextUrl.origin);
  
  try {
    const response = await fetch(authUrl, {
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    });

    const sessionData = await response.json();
    const isAuthenticated = !!sessionData?.session;
    const userRole = sessionData?.user?.role;

    // Redirect to login if unauthenticated and trying to access a protected route
    if (!isAuthenticated && pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Redirect to default dashboard if authenticated and trying to access login
    if (isAuthenticated && pathname === "/login") {
      return NextResponse.redirect(new URL(userRole === "admin" ? "/admin" : "/", request.url));
    }

    // Role-based routing separation
    if (isAuthenticated) {
      const isAdmin = userRole === "admin";
      const isAdminRoute = pathname.startsWith("/admin");

      // Admin trying to access non-admin route (e.g. /inbox, /outbox, /)
      // They should be redirected to /admin
      if (isAdmin && !isAdminRoute) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }

      // Normal user trying to access admin route
      // They should be redirected to /
      if (!isAdmin && isAdminRoute) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

  } catch (error) {
    console.error("Middleware Auth Error:", error);
    // On error (like server down), safely allow or redirect to a fallback.
    // For now, redirect to login if not already there.
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Protect all routes under (dashboard) and root, exclude api, _next/static, _next/image, favicon.ico
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)"
  ],
};
