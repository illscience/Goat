import { NextResponse } from "next/server";

const GITHUB_REPO = "illscience/Goat";

export async function GET() {
  const token = process.env.GH_PAT;

  if (!token) {
    return NextResponse.json({ isBuilding: false });
  }

  try {
    // Get the most recent workflow runs
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/runs?per_page=1`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `Bearer ${token}`,
        },
        // Don't cache this response
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json({ isBuilding: false });
    }

    const data = await response.json();
    const latestRun = data.workflow_runs?.[0];

    // Check if the latest run is in progress or queued
    const isBuilding = latestRun?.status === "in_progress" || latestRun?.status === "queued";

    return NextResponse.json({
      isBuilding,
      status: latestRun?.status,
      conclusion: latestRun?.conclusion,
    });
  } catch {
    return NextResponse.json({ isBuilding: false });
  }
}
