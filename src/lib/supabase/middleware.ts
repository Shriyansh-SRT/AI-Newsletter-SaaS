import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Debug logging
  console.log("Middleware - Pathname:", request.nextUrl.pathname);
  console.log(
    "Middleware - User:",
    user ? "Authenticated" : "Not authenticated"
  );

  // Note: Public routes are now handled by authOnlyRoutes below

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/settings", "/newsletters"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Allow homepage to be accessible for both authenticated and unauthenticated users
  if (request.nextUrl.pathname === "/") {
    console.log("Middleware - Allowing homepage access");
    // No redirect needed - let the homepage component handle the display
    return NextResponse.next();
  }

  // Redirect authenticated users away from signin/auth routes (but allow homepage and preferences)
  const authOnlyRoutes = [
    "/signin",
    "/verify-email",
    "/auth/callback",
    "/auth/auth-code-error",
  ];
  const isAuthOnlyRoute = authOnlyRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (user && isAuthOnlyRoute) {
    console.log(
      "Middleware - Authenticated user accessing auth route, redirecting to dashboard"
    );
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users to signin for protected routes
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
