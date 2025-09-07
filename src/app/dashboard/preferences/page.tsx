"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
// Removed server action import - now using API routes
import { FaCalendarCheck } from "react-icons/fa";
import { IoStatsChart } from "react-icons/io5";
import { FaChartLine } from "react-icons/fa6";
import toast from "react-hot-toast";


// Removed UserPreferences interface - not needed for form-only component

// Skeleton Loading Component
const SkeletonPreferences = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded w-80 mb-2 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-96 animate-pulse"></div>
      </div>

      {/* Form Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-pulse">
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mb-6"></div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div key={j} className="h-10 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const categories = [
  {
    id: "artificial intelligence",
    name: "Artificial Intelligence",
    description: "AI breakthroughs and machine learning",
  },
  {
    id: "machine learning",
    name: "Machine Learning",
    description: "ML algorithms and data science",
  },
  {
    id: "blockchain",
    name: "Blockchain",
    description: "Cryptocurrency and Web3 news",
  },
  {
    id: "cybersecurity",
    name: "Cybersecurity",
    description: "Security threats and protection",
  },
  {
    id: "quantum computing",
    name: "Quantum Computing",
    description: "Quantum technology advances",
  },
  {
    id: "robotics",
    name: "Robotics",
    description: "Automation and robotics news",
  },
  {
    id: "augmented reality",
    name: "Augmented Reality",
    description: "AR/VR and immersive tech",
  },
  {
    id: "cloud computing",
    name: "Cloud Computing",
    description: "Cloud infrastructure and services",
  },
  {
    id: "data science",
    name: "Data Science",
    description: "Big data and analytics",
  },
  {
    id: "startups",
    name: "Startups",
    description: "Tech startup ecosystem",
  },
  {
    id: "fintech",
    name: "Fintech",
    description: "Financial technology innovations",
  },
  {
    id: "biotechnology",
    name: "Biotechnology",
    description: "Bio-tech and health tech",
  },
  {
    id: "technology",
    name: "Technology",
    description: "Latest tech news and innovations",
  },
  {
    id: "business",
    name: "Business",
    description: "Business trends and market updates",
  },
  { id: "sports", name: "Sports", description: "Sports news and highlights" },
  {
    id: "entertainment",
    name: "Entertainment",
    description: "Movies, TV, and celebrity news",
  },
  {
    id: "science",
    name: "Science",
    description: "Scientific discoveries and research",
  },
  { id: "health", name: "Health", description: "Health and wellness updates" },
  {
    id: "politics",
    name: "Politics",
    description: "Political news and current events",
  },
  {
    id: "environment",
    name: "Environment",
    description: "Climate and environmental news",
  },
];

const frequencyOptions = [
  {
    id: "daily",
    name: "Daily",
    description: "Every day",
    icon: <FaCalendarCheck />,
  },
  {
    id: "weekly",
    name: "Weekly",
    description: "Once a week",
    icon: <IoStatsChart />,
  },
  {
    id: "biweekly",
    name: "Bi-weekly",
    description: "Every 2 weeks",
    icon: <FaChartLine />,
  },
];

const PreferencesPage = () => {
  const getSession = useAuthStore((state) => state.getSession);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  // Removed preferences state - not needed for form-only component
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "biweekly">(
    "weekly"
  );
  const [email, setEmail] = useState("");
  // Removed custom category functionality - no delete feature

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchUserPreferences = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching preferences:", error);
      }

      if (data) {
        setSelectedCategories(data.categories);
        setFrequency(data.frequency);
        setEmail(data.email || "");
      } else {
        // Set defaults for new users
        setSelectedCategories(["artificial intelligence", "machine learning"]);
        setEmail(user?.email || "");
      }
    } catch (error) {
      console.error("Failed to fetch preferences:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    getSession();
  }, [getSession]);

  useEffect(() => {
    if (user) {
      fetchUserPreferences();
    }
  }, [user, fetchUserPreferences]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCategories.length === 0) {
      setSubmitError("Please select at least one category");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/user-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          categories: selectedCategories,
          frequency: frequency,
          email: email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Preferences saved successfully!");
        router.push("/dashboard");
      } else {
        setSubmitError(data.error || "Failed to save preferences");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Removed handleAddCustomCategory - no delete functionality

  if (loading) {
    return <SkeletonPreferences />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Sendly Preferences
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Customize your AI-powered newsletter to get the content you want,
              delivered how you want it
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
        >
          {/* Categories Section */}
          <div className="mb-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Choose Your Categories
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Select the topics you&apos;re interested in. Your newsletter
                will include articles from these categories.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedCategories.includes(category.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryToggle(category.id)}
                  />
                  <div className="flex items-center h-5">
                    <div
                      className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                        selectedCategories.includes(category.id)
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedCategories.includes(category.id) && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {category.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {category.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="text-sm text-gray-600 text-center mt-4">
              {selectedCategories.length} categor
              {selectedCategories.length !== 1 ? "ies" : "y"} selected
            </div>
          </div>

          {/* Frequency Section */}
          <div className="mb-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Delivery Frequency
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                How often would you like to receive your newsletter?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {frequencyOptions.map((frequencyOption) => (
                <label
                  key={frequencyOption.id}
                  className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                    frequency === frequencyOption.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="frequency"
                    className="sr-only"
                    checked={frequency === frequencyOption.id}
                    onChange={() =>
                      setFrequency(
                        frequencyOption.id as "daily" | "weekly" | "biweekly"
                      )
                    }
                  />
                  <div className="flex items-center h-5">
                    <div
                      className={`w-5 h-5 border-2 rounded-full flex items-center justify-center ${
                        frequency === frequencyOption.id
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {frequency === frequencyOption.id && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-2xl mb-2">{frequencyOption.icon}</div>
                    <div className="text-sm font-medium text-gray-900">
                      {frequencyOption.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {frequencyOption.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Email Section */}
          <div className="mb-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Email Address
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                The email address where you&apos;ll receive your newsletter.
              </p>
            </div>
            <div className="max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center"
              />
            </div>
          </div>

          {/* Error Display */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{submitError}</p>
            </div>
          )}

          {/* Submit Section */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {selectedCategories.length} categor
              {selectedCategories.length !== 1 ? "ies" : "y"} selected •{" "}
              {frequency} delivery
            </div>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="cursor-pointer px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={selectedCategories.length === 0 || isSubmitting}
                className={`px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 cursor-pointer ${
                  selectedCategories.length === 0 || isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {isSubmitting ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PreferencesPage;
