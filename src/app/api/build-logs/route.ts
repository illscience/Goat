import { NextResponse } from "next/server";

const GITHUB_REPO = "illscience/Goat";

export async function GET() {
  const token = process.env.GH_PAT;

  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 500 });
  }

  try {
    // Get the most recent workflow run
    const runsResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/runs?per_page=1`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!runsResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch runs" }, { status: 500 });
    }

    const runsData = await runsResponse.json();
    const latestRun = runsData.workflow_runs?.[0];

    if (!latestRun) {
      return NextResponse.json({ error: "No runs found" }, { status: 404 });
    }

    const isBuilding = latestRun.status === "in_progress" || latestRun.status === "queued";

    // Get jobs for this run
    const jobsResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/actions/runs/${latestRun.id}/jobs`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }
    );

    if (!jobsResponse.ok) {
      return NextResponse.json({
        isBuilding,
        status: latestRun.status,
        conclusion: latestRun.conclusion,
        logs: [],
      });
    }

    const jobsData = await jobsResponse.json();
    const job = jobsData.jobs?.[0];

    // Extract step information
    const steps = job?.steps?.map((step: { name: string; status: string; conclusion: string | null; started_at: string | null }) => ({
      name: step.name,
      status: step.status,
      conclusion: step.conclusion,
      startedAt: step.started_at,
    })) || [];

    // Calculate elapsed time
    const startedAt = latestRun.created_at ? new Date(latestRun.created_at) : null;
    const elapsedSeconds = startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : 0;

    return NextResponse.json({
      isBuilding,
      status: latestRun.status,
      conclusion: latestRun.conclusion,
      runId: latestRun.id,
      startedAt: latestRun.created_at,
      elapsedSeconds,
      steps,
    });
  } catch (error) {
    console.error("Error fetching build logs:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
