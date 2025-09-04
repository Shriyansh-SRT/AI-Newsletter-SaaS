"use client";

import { useState } from "react";
import {
  testEmailJSConfig,
  sendNewsletterEmails,
} from "@/actions/send-newsletter";

export default function TestPage() {
  const [configResult, setConfigResult] = useState<any | null>(null);
  const [emailResult, setEmailResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const testConfig = async () => {
    setLoading(true);
    try {
      const result = await testEmailJSConfig();
      setConfigResult(result);
    } catch (error) {
      setConfigResult({
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const testEmailSending = async () => {
    setLoading(true);
    try {
      const result = await sendNewsletterEmails();
      setEmailResult(result);
    } catch (error) {
      setEmailResult({
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Newsletter System Test
        </h1>

        <div className="space-y-6">
          {/* EmailJS Configuration Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              EmailJS Configuration
            </h2>
            <button
              onClick={testConfig}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Testing..." : "Test Configuration"}
            </button>

            {configResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Results:</h3>
                <pre className="text-sm">
                  {JSON.stringify(configResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Email Sending Test */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Email Sending Test</h2>
            <button
              onClick={testEmailSending}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Pending Emails"}
            </button>

            {emailResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Results:</h3>
                <pre className="text-sm">
                  {JSON.stringify(emailResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
