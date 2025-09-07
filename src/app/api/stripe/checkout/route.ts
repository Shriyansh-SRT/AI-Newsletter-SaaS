import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the user session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    console.log("User:", user?.email);

    if (!user) {
      console.log("No user found");
      return NextResponse.json(
        { error: "You must be logged in to create a checkout session." },
        { status: 401 }
      );
    }

    const { priceId } = await request.json();
    console.log("Price ID received:", priceId);

    if (!priceId) {
      console.log("No price ID provided");
      return NextResponse.json(
        { error: "Price ID is required." },
        { status: 400 }
      );
    }

    console.log(
      "Success URL:",
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_APP_URL
        : "http://localhost:3000"
    );
    console.log(
      "Cancel URL:",
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_APP_URL
        : "http://localhost:3000"
    );

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${
        process.env.NODE_ENV === "production"
          ? process.env.NEXT_PUBLIC_APP_URL
          : "http://localhost:3000"
      }/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.NODE_ENV === "production"
          ? process.env.NEXT_PUBLIC_APP_URL
          : "http://localhost:3000"
      }/subscription`,
      metadata: {
        userId: user.id,
        userEmail: user.email || "",
        priceId: priceId, // Store the price ID for webhook processing
      },
      payment_method_types: ["card"],
      billing_address_collection: "auto",
    });

    console.log("Checkout session created:", session.id);

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
