import { NextRequest, NextResponse } from "next/server";

const GITHUB_REPO = "illscience/Goat";
const WORKFLOW_FILE = "goat-build.yml";

export async function POST(request: NextRequest) {
  try {
    // Optional: Add a simple secret to prevent random triggers
    const { secret } = await request.json().catch(() => ({}));

    if (process.env.BUILD_TRIGGER_SECRET && secret !== process.env.BUILD_TRIGGER_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { error: "GitHub token not configured" },
        { status: 500 }
      );
    }

    // Trigger the GitHub Actions workflow
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILE}/dispatches`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: "main",
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("GitHub API error:", error);
      return NextResponse.json(
        { error: "Failed to trigger build" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Build triggered! The Goat is waking up..."
    });
  } catch (error) {
    console.error("Trigger build error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also allow GET for simple testing
export async function GET() {
  return NextResponse.json({
    message: "Use POST to trigger a build",
    status: "ready"
  });
}
