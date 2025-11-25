"use client";

import { useEffect, useState } from "react";

interface BuildAttempt {
  attemptNumber: number;
  buildErrors: string[];
  runtimeErrors: string[];
  fixed: boolean;
}

interface FeatureIdea {
  title: string;
  emoji: string;
  description: string;
  concept: string;
  category: string;
  usesAI: boolean;
  usesImageGen: boolean;
}

interface DebugBuildLog {
  id: string;
  timestamp: string;
  day: number;
  idea: FeatureIdea | null;
  slug: string;
  success: boolean;
  attempts: BuildAttempt[];
  finalError?: string;
}

export default function DebugBuildsPage() {
  const [logs, setLogs] = useState<DebugBuildLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<DebugBuildLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/debug/builds")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <p>Loading build logs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Build Debug Logs</h1>
      <p className="text-gray-400 mb-8">
        This page shows detailed logs for all build attempts, including failures.
      </p>

      {logs.length === 0 ? (
        <p className="text-gray-500">No build logs found.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Log list */}
          <div className="lg:col-span-1 space-y-2">
            {logs.map((log) => (
              <button
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedLog?.id === log.id
                    ? "border-white bg-white/10"
                    : "border-gray-700 hover:border-gray-500"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm">Day {log.day}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      log.success
                        ? "bg-green-900 text-green-300"
                        : "bg-red-900 text-red-300"
                    }`}
                  >
                    {log.success ? "SUCCESS" : "FAILED"}
                  </span>
                </div>
                <div className="text-sm">
                  {log.idea?.emoji} {log.idea?.title || "Unknown"}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </button>
            ))}
          </div>

          {/* Log detail */}
          <div className="lg:col-span-2">
            {selectedLog ? (
              <div className="border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">
                    {selectedLog.idea?.emoji} {selectedLog.idea?.title}
                  </h2>
                  <span
                    className={`px-3 py-1 rounded ${
                      selectedLog.success
                        ? "bg-green-900 text-green-300"
                        : "bg-red-900 text-red-300"
                    }`}
                  >
                    {selectedLog.success ? "SUCCESS" : "FAILED"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                  <div>
                    <span className="text-gray-500">Day:</span> {selectedLog.day}
                  </div>
                  <div>
                    <span className="text-gray-500">Slug:</span>{" "}
                    <code className="bg-gray-800 px-1 rounded">
                      {selectedLog.slug}
                    </code>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>{" "}
                    {selectedLog.idea?.category}
                  </div>
                  <div>
                    <span className="text-gray-500">Uses AI:</span>{" "}
                    {selectedLog.idea?.usesAI ? "Yes" : "No"}
                  </div>
                </div>

                {selectedLog.idea?.concept && (
                  <div className="mb-6">
                    <h3 className="text-sm text-gray-500 mb-2">Concept</h3>
                    <p className="text-gray-300">{selectedLog.idea.concept}</p>
                  </div>
                )}

                {selectedLog.finalError && (
                  <div className="mb-6 p-4 bg-red-950 border border-red-800 rounded">
                    <h3 className="text-sm text-red-400 mb-2">Final Error</h3>
                    <p className="text-red-300">{selectedLog.finalError}</p>
                  </div>
                )}

                <h3 className="text-sm text-gray-500 mb-4">
                  Attempts ({selectedLog.attempts.length})
                </h3>

                <div className="space-y-4">
                  {selectedLog.attempts.map((attempt) => (
                    <div
                      key={attempt.attemptNumber}
                      className="border border-gray-700 rounded p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono">
                          Attempt #{attempt.attemptNumber}
                        </span>
                        {attempt.fixed && (
                          <span className="text-xs bg-green-900 text-green-300 px-2 py-1 rounded">
                            FIXED
                          </span>
                        )}
                      </div>

                      {attempt.buildErrors.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-xs text-red-400 mb-2">
                            Build Errors
                          </h4>
                          <pre className="text-xs bg-gray-900 p-3 rounded overflow-x-auto max-h-40 overflow-y-auto">
                            {attempt.buildErrors.join("\n")}
                          </pre>
                        </div>
                      )}

                      {attempt.runtimeErrors.length > 0 && (
                        <div>
                          <h4 className="text-xs text-orange-400 mb-2">
                            Runtime Errors
                          </h4>
                          <pre className="text-xs bg-gray-900 p-3 rounded overflow-x-auto max-h-40 overflow-y-auto">
                            {attempt.runtimeErrors.join("\n")}
                          </pre>
                        </div>
                      )}

                      {attempt.buildErrors.length === 0 &&
                        attempt.runtimeErrors.length === 0 && (
                          <p className="text-sm text-green-400">
                            No errors on this attempt
                          </p>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="border border-gray-700 rounded-lg p-6 text-center text-gray-500">
                Select a build log to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
