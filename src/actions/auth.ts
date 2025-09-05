"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const signInSchema = z
  .object({
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
        message: "Please provide a valid email address",
      }),

    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[@$!%*?&#]/, {
        message:
          "Password must contain at least one special character (@, $, !, %, *, ?, &, #)",
      }),

    confirmPassword: z
      .string()
      .min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type SignInErrorProps = {
  email: string[];
  password: string[];
  confirmPassword: string[];
  formError: string[];
};

export type SignInProps = {
  errors?: SignInErrorProps;
};

export const signIn = async (prevState: SignInProps, formData: FormData) => {
  // Create a supabase client
  const supabase = await createClient();

  // Get form data
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;
  const isSignUp = formData.get("isSignUp") === "true";

  // Validate input fields
  const validatedFields = signInSchema.safeParse({
    email,
    password,
    confirmPassword: isSignUp ? confirmPassword : password, // Use password as confirmPassword for sign-in
  });
  const myError: SignInErrorProps = {
    email: [],
    password: [],
    confirmPassword: [],
    formError: [],
  };

  if (!validatedFields.success) {
    console.log("fieldErrors", validatedFields.error);

    // handle specific errors
    validatedFields.error.issues.forEach((issue) => {
      if (issue.path[0] === "email") {
        myError.email.push(issue.message);
      }
      if (issue.path[0] === "password") {
        myError.password.push(issue.message);
      }
      if (issue.path[0] === "confirmPassword") {
        myError.confirmPassword.push(issue.message);
      }
    });

    return {
      errors: myError,
    };
  }

  // Check if passwords match for sign up
  if (isSignUp && password !== confirmPassword) {
    return {
      errors: {
        email: [],
        password: [],
        confirmPassword: ["Passwords do not match"],
        formError: [],
      },
    };
  }

  try {
    if (isSignUp) {
      // Handle sign up
      const { data, error } = await supabase.auth.signUp({ email, password });

      console.log("signup data", data);
      console.log("signup error", error);

      if (error) {
        return {
          errors: {
            email: [],
            password: [],
            confirmPassword: [],
            formError: [error.message],
          },
        };
      }

      // Check if email confirmation is required
      if (data.user && !data.user.user_metadata.email_verified) {
        // Redirect to verification page
        redirect("/verify-email");
      } else {
        // Email confirmation not required, redirect to dashboard
        redirect("/dashboard");
      }
    } else {
      // Handle sign in
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("error", error);

      if (error) {
        // Handle specific error cases for better UX
        let errorMessage = error.message;

        if (
          error.message.includes("Invalid login credentials") ||
          error.code === "invalid_credentials"
        ) {
          errorMessage =
            "Account not found. Please sign up first or check your email and password.";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage =
            "Please check your email and click the verification link to activate your account.";
        }

        return {
          errors: {
            email: [],
            password: [],
            confirmPassword: [],
            formError: [errorMessage],
          },
        };
      }

      redirect("/dashboard");
    }
  } catch (error) {
    // Check if this is a Next.js redirect (which is expected)
    if (error && typeof error === "object" && "digest" in error) {
      // This is a Next.js redirect, let it pass through
      throw error;
    }

    if (error instanceof Error) {
      return {
        errors: {
          email: [],
          password: [],
          confirmPassword: [],
          formError: [error.message],
        },
      };
    }

    // Handle non-Error objects
    return {
      errors: {
        email: [],
        password: [],
        confirmPassword: [],
        formError: ["An unexpected error occurred. Please try again."],
      },
    };
  }
};

export const logout = async () => {
  const supabase = await createClient();
  try {
    await supabase.auth.signOut();
    redirect("/signin");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }

    redirect("/signin");
  }
};

export const signInWithGoogle = async () => {
  try {
    const supabase = await createClient();
    const redirectUrl = `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/auth/callback`;

    console.log("Google OAuth - redirect URL:", redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (error) {
      console.error("Google OAuth error:", error);
      throw new Error(`Failed to sign in with Google: ${error.message}`);
    }

    if (data.url) {
      console.log("Google OAuth - redirecting to:", data.url);
      redirect(data.url);
    } else {
      throw new Error("No redirect URL received from Google OAuth");
    }
  } catch (error) {
    console.error("Google OAuth signin error:", error);
    throw error;
  }
};

export const signInWithFacebook = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/auth/callback`,
    },
  });

  if (error) {
    console.error("Facebook OAuth error:", error);
    throw new Error("Failed to sign in with Facebook");
  }

  if (data.url) {
    redirect(data.url);
  }
};
