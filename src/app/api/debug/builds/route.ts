import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function GET() {
  const logsPath = path.join(process.cwd(), "src", "data", "build-logs.json");

  if (!fs.existsSync(logsPath)) {
    return NextResponse.json({ logs: [] });
  }

  try {
    const logs = JSON.parse(fs.readFileSync(logsPath, "utf-8"));
    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ logs: [], error: "Failed to parse logs" });
  }
}
