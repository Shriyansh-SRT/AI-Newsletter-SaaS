import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  console.log("Root middleware called for:", request.nextUrl.pathname);

  // Simple test - redirect homepage to signin
  if (request.nextUrl.pathname === "/") {
    console.log("Redirecting homepage to signin");
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
