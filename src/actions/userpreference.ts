"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { inngest } from "@/lib/inngest/client";

// Validation schema for user preferences
const UserPreferencesSchema = z.object({
  selectedCategories: z
    .array(z.string())
    .min(1, "At least one category is required"),
  frequency: z.enum(["daily", "weekly", "biweekly"]),
  email: z.string().email("Invalid email address"),
});

export type UserPreferencesInput = z.infer<typeof UserPreferencesSchema>;

export const createUpdateUserPreferences = async (
  prevState: { error: string | null; success: boolean; message: string | null },
  formData: FormData
): Promise<{
  error: string | null;
  success: boolean;
  message: string | null;
}> => {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        error: "Authentication required. Please sign in.",
        success: false,
        message: null,
      };
    }

    // Parse and validate form data
    const rawData = {
      selectedCategories: formData.getAll("categories") as string[],
      frequency: formData.get("frequency") as "daily" | "weekly" | "biweekly",
      email: formData.get("email") as string,
    };

    // Validate input
    const validationResult = UserPreferencesSchema.safeParse(rawData);
    if (!validationResult.success) {
      return {
        error:
          validationResult.error.issues[0]?.message || "Invalid input data",
        success: false,
        message: null,
      };
    }

    const { selectedCategories, frequency, email } = validationResult.data;

    // Check if categories array is not empty
    if (selectedCategories.length === 0) {
      return {
        error: "Please select at least one category",
        success: false,
        message: null,
      };
    }

    // Upsert user preferences
    const { error: upsertError } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: user.id,
          categories: selectedCategories,
          frequency: frequency,
          email: email,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (upsertError) {
      console.error("Database error:", upsertError);
      return {
        error: "Failed to save preferences. Please try again.",
        success: false,
        message: null,
      };
    }

    // Send Inngest event to schedule newsletter
    await inngest.send({
      name: "newsletter.schedule",
      data: {
        userId: user.id,
        email: email,
        categories: selectedCategories,
        frequency: frequency,
      },
    });

    // Revalidate dashboard page to show updated data
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/preferences");

    return {
      error: null,
      success: true,
      message: "Preferences saved successfully!",
    };
  } catch (error) {
    console.error("Server action error:", error);
    return {
      error: "An unexpected error occurred. Please try again.",
      success: false,
      message: null,
    };
  }
};

// Alternative function for programmatic updates (from client components)
export const updateUserPreferencesProgrammatically = async (
  userId: string,
  preferences: UserPreferencesInput
) => {
  try {
    const supabase = await createClient();

    // Validate input
    const validationResult = UserPreferencesSchema.safeParse(preferences);
    if (!validationResult.success) {
      throw new Error(
        validationResult.error.issues[0]?.message || "Invalid input data"
      );
    }

    const { selectedCategories, frequency, email } = validationResult.data;

    // Upsert user preferences
    const { error } = await supabase.from("user_preferences").upsert(
      {
        user_id: userId,
        categories: selectedCategories,
        frequency: frequency,
        email: email,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) {
      throw new Error("Failed to save preferences");
    }

    // Revalidate pages
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/preferences");

    return { success: true };
  } catch (error) {
    console.error("Programmatic update error:", error);
    throw error;
  }
};
