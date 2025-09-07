import { NextResponse } from "next/server";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";

export async function GET() {
  try {
    // Return the subscription plans with server-side environment variables
    const plans = SUBSCRIPTION_PLANS.map((plan) => ({
      ...plan,
      priceId:
        plan.id === "pro"
          ? process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || ""
          : plan.id === "premium"
          ? process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || ""
          : "",
    }));

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription plans" },
      { status: 500 }
    );
  }
}
