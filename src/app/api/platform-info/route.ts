import { NextResponse } from "next/server";
import { platformSettings } from "@/lib/platform";
export async function GET() {
  const settings = await platformSettings();
  return NextResponse.json({ name: settings.name, logoUrl: settings.logoUrl ? `/api/platform/logo?v=${settings.updatedAt.getTime()}` : null, registrationOpen: settings.registrationOpen }, { headers: { "Cache-Control": "no-store" } });
}
