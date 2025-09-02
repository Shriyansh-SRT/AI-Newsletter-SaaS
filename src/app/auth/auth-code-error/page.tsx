import React from "react";
import Link from "next/link";

const AuthCodeErrorPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-red-100 rounded-xl flex items-center justify-center">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            There was an issue with your authentication
          </p>
        </div>

        {/* Content */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
          <div className="text-center space-y-6">
            <div className="text-gray-600">
              <p className="mb-4">
                We encountered an error while processing your authentication
                request.
              </p>
              <p className="text-sm">
                This could be due to an expired link or an invalid
                authentication code.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/signin"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Try signing in again
              </Link>

              <Link
                href="/"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Go to homepage
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          Need help?{" "}
          <Link href="/support" className="text-blue-600 hover:text-blue-500">
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthCodeErrorPage;
