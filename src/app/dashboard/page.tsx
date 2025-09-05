"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import Link from "next/link";

interface UserPreferences {
  categories: string[];
  frequency: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

// Skeleton Loading Component
const SkeletonCard = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 backdrop-blur-sm bg-white/80 animate-pulse">
    <div className="flex items-center justify-between mb-6">
      <div className="h-6 bg-gray-200 rounded w-48"></div>
      <div className="h-6 bg-gray-200 rounded w-16"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </div>
      ))}
    </div>
  </div>
);

export default function DashboardPage() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuthStore();

  console.log("Dashboard component mounted/rendered");

  useEffect(() => {
    console.log(
      "Dashboard useEffect - authLoading:",
      authLoading,
      "user:",
      user?.email,
      "isAuthenticated:",
      isAuthenticated
    );

    // Wait for auth to finish loading
    if (authLoading) {
      console.log("Auth still loading, waiting...");
      return;
    }

    // If no user after auth loading is complete, redirect to signin
    if (!user || !isAuthenticated) {
      console.log("No user or not authenticated, redirecting to signin");
      // Check if we just came from a signin redirect (might need page refresh)
      if (window.location.pathname === "/dashboard" && !user) {
        console.log(
          "Dashboard accessed without user, refreshing page to sync auth state"
        );
        window.location.reload();
        return;
      }
      router.replace("/signin");
      return;
    }

    console.log("User authenticated, fetching preferences...");

    // Add a small delay to ensure auth state is fully synchronized
    const timeoutId = setTimeout(() => {
      // Fetch preferences only after we have a user
      fetch("/api/user-preferences")
        .then((response) => {
          console.log("Preferences response:", response.status);
          if (response && response.ok) {
            return response.json();
          }
          throw new Error("Failed to fetch preferences");
        })
        .then((data) => {
          console.log("Preferences data:", data);
          if (data) {
            setPreferences(data);
          }
        })
        .catch((error) => {
          console.log("Error fetching preferences:", error);
          router.replace("/dashboard/preferences");
        })
        .finally(() => {
          console.log("Setting loading to false");
          setIsLoading(false);
        });
    }, 200); // Small delay to ensure auth state is synchronized

    return () => clearTimeout(timeoutId);
  }, [router, user, authLoading, isAuthenticated]);

  const handleUpdatePreferences = () => {
    router.push("/dashboard/preferences");
  };

  const handleDeactivateNewsletter = async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/user-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: false }),
      });

      if (response.ok) {
        setPreferences((prev) => (prev ? { ...prev, is_active: false } : null));
        alert("Newsletter deactivated successfully");
      }
    } catch (error) {
      console.error("Error deactivating newsletter:", error);
      alert("Failed to deactivate newsletter");
    }
  };

  const handleActivateNewsletter = async () => {
    if (!user) return;

    try {
      const response = await fetch("/api/user-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });

      if (response.ok) {
        setPreferences((prev) => (prev ? { ...prev, is_active: true } : null));
        alert("Newsletter activated successfully");
      }
    } catch (error) {
      console.error("Error activating newsletter:", error);
      alert("Failed to activate newsletter");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full mr-2 ${
            isActive ? "bg-green-400" : "bg-red-400"
          }`}
        ></div>
        {isActive ? "Active" : "Paused"}
      </span>
    );
  };

  const getFrequencyDisplay = (frequency: string) => {
    const frequencyMap = {
      daily: "Daily",
      weekly: "Weekly",
      biweekly: "Bi-weekly",
    };
    return frequencyMap[frequency as keyof typeof frequencyMap] || frequency;
  };

  // Show loading while auth is loading or preferences are loading
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header Skeleton */}
          <div className="text-center mb-12">
            <div className="h-10 bg-gray-200 rounded w-80 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>

          {/* Cards Skeleton */}
          <div className="space-y-8">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Sendly Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Manage your personalized newsletter preferences and stay informed
            with AI-curated content tailored just for you
          </p>
        </div>

        {/* Current Preferences Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8 backdrop-blur-sm bg-white/80">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Current Preferences
              </h2>
              <p className="text-gray-600">
                Your newsletter settings and delivery preferences
              </p>
            </div>
            {preferences && getStatusBadge(preferences.is_active)}
          </div>

          {preferences ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Categories */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {preferences.categories.map((category, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              {/* Frequency */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Frequency
                </h3>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {getFrequencyDisplay(preferences.frequency)}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Email
                </h3>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {preferences.email || user?.email || "Not set"}
                  </p>
                </div>
              </div>

              {/* Created Date */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                  Created
                </h3>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(preferences.created_at)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No preferences set
              </h3>
              <p className="text-gray-600 mb-6">
                Set up your newsletter preferences to start receiving
                personalized content
              </p>
              <button
                onClick={handleUpdatePreferences}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Set Up Preferences
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8 backdrop-blur-sm bg-white/80">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Actions
            </h2>
            <p className="text-gray-600">
              Manage your newsletter settings and subscription
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={handleUpdatePreferences}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Update Preferences</h3>
                  <p className="text-blue-100 text-sm">
                    Customize your newsletter
                  </p>
                </div>
              </div>
            </button>

            {preferences && (
              <>
                {preferences.is_active ? (
                  <button
                    onClick={handleDeactivateNewsletter}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-red-600 to-red-700 p-6 text-white hover:from-red-700 hover:to-red-800 transition-all duration-200 transform hover:scale-105"
                  >
                    <div className="flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">Pause Sendly</h3>
                        <p className="text-red-100 text-sm">
                          Temporarily stop delivery
                        </p>
                      </div>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={handleActivateNewsletter}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-green-600 to-green-700 p-6 text-white hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105"
                  >
                    <div className="flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">Resume Sendly</h3>
                        <p className="text-green-100 text-sm">
                          Resume newsletter delivery
                        </p>
                      </div>
                    </div>
                  </button>
                )}
              </>
            )}

            <Link
              href="/dashboard/preferences"
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 p-6 text-white hover:from-gray-700 hover:to-gray-800 transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-lg">Manage Subscription</h3>
                  <p className="text-gray-100 text-sm">Billing and plans</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 backdrop-blur-sm bg-white/80">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              How It Works
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Your personalized newsletter journey from content curation to
              delivery
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Personalized Content Generation
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Your newsletter is automatically generated based on your
                    selected categories using advanced AI technology.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Scheduled Delivery
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Sendly newsletters are delivered at your chosen frequency
                    (daily, weekly, or bi-weekly) directly to your email.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Flexible Control
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Pause and resume your newsletter at any time, update your
                    preferences, or manage your subscription with ease.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg font-bold">4</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Smart Curation
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Our AI analyzes thousands of articles to bring you the most
                    relevant and interesting content from your chosen topics.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
