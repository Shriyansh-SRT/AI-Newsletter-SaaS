export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  priceId: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
  buttonVariant: "default" | "outline" | "secondary";
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started with personalized newsletters",
    price: 0,
    priceId: "",
    features: [
      "1 newsletter per week",
      "Basic categories (5 max)",
      "Email support",
      "Standard templates",
    ],
    buttonText: "Current Plan",
    buttonVariant: "secondary",
  },
  {
    id: "pro",
    name: "Pro",
    description: "For power users who want more content and customization",
    price: 9.99,
    priceId: "", // Will be populated by API
    features: [
      "3 newsletters per week",
      "All categories (unlimited)",
      "Priority support",
      "Premium templates",
      "Custom scheduling",
      "Analytics dashboard",
    ],
    popular: true,
    buttonText: "Upgrade to Pro",
    buttonVariant: "default",
  },
  {
    id: "premium",
    name: "Premium",
    description:
      "For businesses and content creators who need maximum features",
    price: 19.99,
    priceId: "", // Will be populated by API
    features: [
      "Daily newsletters",
      "All categories (unlimited)",
      "24/7 priority support",
      "Custom branding",
      "Advanced analytics",
      "API access",
      "White-label options",
      "Custom integrations",
    ],
    buttonText: "Upgrade to Premium",
    buttonVariant: "outline",
  },
];
