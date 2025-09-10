import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inngest } from "@/lib/inngest/client";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Get the user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be logged in to save preferences." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { categories, frequency, email } = body;

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: "Categories array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (!frequency || !["daily", "weekly", "biweekly"].includes(frequency)) {
      return NextResponse.json(
        { error: "Valid frequency is required (daily, weekly, biweekly)" },
        { status: 400 }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      );
    }

    // Save user preferences to database
    const { error: upsertError } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: user.id,
          categories: categories,
          frequency: frequency,
          email: email, // Use the email from the form
          is_active: true,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("Error saving preferences:", upsertError);
      return NextResponse.json(
        { error: "Failed to save preferences" },
        { status: 500 }
      );
    }

    // Schedule the first newsletter - let Inngest handle the timing
    try {
      let ids;

      if (process.env.NODE_ENV === "development") {
        // Use local Inngest dev server
        const { ids: localIds } = await inngest.send({
          name: "newsletter.schedule",
          data: {
            userId: user.id,
            email: email,
            categories: categories,
            frequency: frequency,
            isTest: true,
          },
        });
        ids = localIds;
      } else {
        // Use Inngest client for production (proper way)
        const result = await inngest.send({
          name: "newsletter.schedule",
          data: {
            userId: user.id,
            email: email,
            categories: categories,
            frequency: frequency,
            isTest: true, // Send immediate newsletter in production too
          },
        });
        ids = result.ids;
      }

      return NextResponse.json({
        success: true,
        message: "Preferences saved and newsletter scheduled",
        scheduleId: ids[0],
      });
    } catch (inngestError) {
      console.error("Inngest scheduling failed:", inngestError);
      // Still return success for preferences saving
      return NextResponse.json({
        success: true,
        message:
          "Preferences saved successfully (newsletter scheduling failed)",
        warning: "Newsletter scheduling is temporarily unavailable",
      });
    }
  } catch (error) {
    console.error("Error in user-preferences API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  // Get the user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be logged in to update preferences." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { is_active } = body;

    // Update user preferences
    const { error: updateError } = await supabase
      .from("user_preferences")
      .update({ is_active })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating preferences:", updateError);
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 }
      );
    }

    // If reactivating the newsletter, schedule the next one
    if (is_active) {
      try {
        // Get user preferences for rescheduling
        const { data: preferences, error: prefError } = await supabase
          .from("user_preferences")
          .select("categories, frequency, email")
          .eq("user_id", user.id)
          .single();

        if (!prefError && preferences) {
          // Schedule immediate newsletter (let Inngest handle timing)
          try {
            await inngest.send({
              name: "newsletter.schedule",
              data: {
                userId: user.id,
                email: preferences.email, // Use the stored email from preferences
                categories: preferences.categories,
                frequency: preferences.frequency,
                isTest: process.env.NODE_ENV !== "production", // Test mode only in development
              },
            });
          } catch (inngestError) {
            console.error("Inngest rescheduling failed:", inngestError);
            // Don't fail the request if Inngest fails
          }
        }
      } catch (rescheduleError) {
        console.error("Error rescheduling newsletter:", rescheduleError);
        // Don't fail the request if rescheduling fails, just log it
      }
    }

    return NextResponse.json({
      success: true,
      message: "Preferences updated successfully",
    });
  } catch (error) {
    console.error("Error in user-preferences PATCH API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Removed rescheduleUserNewsletter function - scheduling now handled by Inngest

// get user preferences
export async function GET() {
  const supabase = await createClient();

  // Get the user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be logged in to fetch preferences." },
      { status: 401 }
    );
  }

  try {
    // Get user preferences
    const { data: preferences, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found
      console.error("Error fetching preferences:", error);
      return NextResponse.json(
        { error: "Failed to fetch preferences" },
        { status: 500 }
      );
    }

    if (!preferences) {
      return NextResponse.json(
        { error: "No preferences found" },
        { status: 404 }
      );
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error in user-preferences GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
