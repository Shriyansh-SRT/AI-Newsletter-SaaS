import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  console.log("OAuth callback - code:", code ? "present" : "missing");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    console.log(
      "OAuth callback - exchange result:",
      error ? "error" : "success",
      data?.user?.email
    );

    if (!error && data?.user) {
      // Successful OAuth login, redirect to dashboard
      console.log("OAuth callback - redirecting to dashboard");
      return NextResponse.redirect(requestUrl.origin + "/dashboard");
    }
  }

  console.log("OAuth callback - redirecting to error page");
  // Return the user to an error page with instructions
  return NextResponse.redirect(requestUrl.origin + "/auth/auth-code-error");
}
