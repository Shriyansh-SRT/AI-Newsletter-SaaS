import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature provided" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const userEmail = session.metadata?.userEmail;
        const priceId = session.metadata?.priceId; // Get price ID from metadata

        console.log("Checkout session completed:", session.id);
        console.log("User ID:", userId);
        console.log("Customer ID:", session.customer);
        console.log("Price ID:", priceId);

        if (userId && userEmail && priceId) {
          const supabase = await createClient();

          // Determine subscription plan from price ID
          let subscriptionPlan = "free";
          if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID) {
            subscriptionPlan = "pro";
          } else if (
            priceId === process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID
          ) {
            subscriptionPlan = "premium";
          }

          console.log("Updating user preferences with plan:", subscriptionPlan);

          // Update user preferences with subscription info
          const { error } = await supabase
            .from("user_preferences")
            .update({
              subscription_plan: subscriptionPlan,
              subscription_status: "active",
              stripe_customer_id: session.customer,
              subscription_id: session.subscription,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

          if (error) {
            console.error("Error updating user preferences:", error);
          } else {
            console.log("Successfully updated user preferences");
          }
        } else {
          console.error("Missing required metadata:", {
            userId,
            userEmail,
            priceId,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log("Subscription updated:", subscription.id);
        console.log("Customer ID:", customerId);
        console.log("Status:", subscription.status);

        const supabase = await createClient();

        // Update subscription status
        const { error } = await supabase
          .from("user_preferences")
          .update({
            subscription_status: subscription.status,
            subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Error updating subscription status:", error);
        } else {
          console.log("Successfully updated subscription status");
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log("Subscription deleted:", subscription.id);
        console.log("Customer ID:", customerId);

        const supabase = await createClient();

        // Update subscription status to cancelled
        const { error } = await supabase
          .from("user_preferences")
          .update({
            subscription_plan: "free",
            subscription_status: "cancelled",
            subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Error cancelling subscription:", error);
        } else {
          console.log("Successfully cancelled subscription");
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
