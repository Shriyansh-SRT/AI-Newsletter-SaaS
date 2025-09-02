import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/signin";

  console.log("Auth callback - Code:", code ? "present" : "missing");
  console.log("Auth callback - Next:", next);

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      console.log("Auth callback - Exchange result:", {
        data: !!data,
        error: error?.message,
      });

      if (!error) {
        console.log("Auth callback - Redirecting to:", `${origin}${next}`);
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        console.log("Auth callback - Exchange error:", error.message);
        return NextResponse.redirect(
          `${origin}/signin?error=verification_failed`
        );
      }
    } catch (err) {
      console.log("Auth callback - Exception:", err);
      return NextResponse.redirect(
        `${origin}/signin?error=verification_failed`
      );
    }
  }

  // No code provided
  console.log("Auth callback - No code provided");
  return NextResponse.redirect(`${origin}/signin?error=no_code`);
}
