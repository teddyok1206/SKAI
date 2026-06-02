import { NextResponse } from "next/server";
import { getDeploymentHealth } from "@/lib/deployment-health";

export async function GET() {
  return NextResponse.json(getDeploymentHealth());
}
