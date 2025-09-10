"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FaCalendarCheck } from "react-icons/fa";
import { IoStatsChart } from "react-icons/io5";
import { FaChartLine } from "react-icons/fa6";
import { useAuthStore } from "@/lib/stores/auth-store";
import toast from "react-hot-toast";

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

export default function PublicPreferencesPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "biweekly">(
    "weekly"
  );
  const [email, setEmail] = useState("");
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSavePreferences = () => {
    // Check if user has made selections
    if (selectedCategories.length === 0) {
      toast.error("Please select at least one category");
      return;
    }

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    // Simply redirect to signin - user will set preferences after authentication
    router.push(
      "/signin?message=Please sign in to create your newsletter preferences"
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation - only show for unauthenticated users */}
      {!isAuthenticated && (
        <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Sendly
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/")}
                className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              >
                Back to Home
              </button>
            </div>
          </div>
        </nav>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Preview Your Newsletter
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Explore the categories and settings available for your personalized
            AI-curated newsletter
          </p>
        </div>

        {/* Categories Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            What topics interest you?
          </h2>
          <p className="text-gray-600 mb-8">
            Select all the categories you&apos;d like to receive news about. You
            can change these anytime.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() => handleCategoryToggle(category.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedCategories.includes(category.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <h3 className="font-semibold text-gray-900 mb-2">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Frequency Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            How often would you like to receive your newsletter?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                id: "daily",
                name: "Daily",
                description: "Every morning at 9 AM",
                icon: FaChartLine,
              },
              {
                id: "weekly",
                name: "Weekly",
                description: "Every Monday at 9 AM",
                icon: IoStatsChart,
              },
              {
                id: "biweekly",
                name: "Bi-weekly",
                description: "Every other Monday at 9 AM",
                icon: FaCalendarCheck,
              },
            ].map((option) => {
              const IconComponent = option.icon;
              return (
                <div
                  key={option.id}
                  onClick={() =>
                    setFrequency(option.id as "daily" | "weekly" | "biweekly")
                  }
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                    frequency === option.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center mb-3">
                    <IconComponent
                      className={`h-6 w-6 mr-3 ${
                        frequency === option.id
                          ? "text-blue-600"
                          : "text-gray-400"
                      }`}
                    />
                    <h3 className="font-semibold text-gray-900">
                      {option.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Email Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            Where should we send your newsletter?
          </h2>

          <div className="max-w-md">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-sm text-gray-600 mt-2">
              We&apos;ll use this email to send your personalized newsletter
            </p>
          </div>
        </div>

        {/* Get Started Button */}
        <div className="text-center">
          <button
            onClick={handleSavePreferences}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105 cursor-pointer"
          >
            Get Started
          </button>
          <p className="text-sm text-gray-600 mt-4">
            Sign up to create your personalized newsletter with these settings
          </p>
        </div>
      </div>
    </div>
  );
}
