import { NextRequest, NextResponse } from "next/server";

interface TokenPayload {
  userId: number | string;
  email: string;
  role: string;
}

function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = JSON.parse(
      Buffer.from(payload, "base64").toString("utf-8")
    );
    return decoded as TokenPayload;
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("token")?.value;

  // Get decoded token if exists
  const decodedToken = token ? decodeToken(token) : null;

  // Public routes - allow access without auth
  const publicRoutes = ["/login", "/api/auth/login", "/"];
  if (publicRoutes.some((route) => pathname === route)) {
    if (token && decodedToken) {
      // If already logged in, redirect based on role
      if (decodedToken.role === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
      } else if (decodedToken.role === "employee") {
        return NextResponse.redirect(new URL("/employee/dashboard", request.url));
      }
      // For invalid roles, clear token and allow access to login
      const response = NextResponse.next();
      response.cookies.delete("token");
      return response;
    }
    // Allow access to public routes
    if (pathname === "/") return NextResponse.next();
    return NextResponse.next();
  }

  // API routes - allow them to pass through (they handle auth)
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!token || !decodedToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (decodedToken.role !== "admin") {
      return NextResponse.redirect(new URL("/employee/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protect employee routes
  if (pathname.startsWith("/employee")) {
    if (!token || !decodedToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (decodedToken.role !== "employee" && decodedToken.role !== "admin") {
      // Invalid token - clear it and redirect to login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("token");
      return response;
    }
    return NextResponse.next();
  }

  // Home page redirect
  if (pathname === "/" && token && decodedToken) {
    const dashboardPath =
      decodedToken.role === "admin" ? "/admin" : "/employee/dashboard";
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
