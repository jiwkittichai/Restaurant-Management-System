import { NextRequest, NextResponse } from "next/server";
import { authorizePlatform, destroyPlatformSession, platformWriteRequest } from "@/lib/platform";
import { requestError } from "@/lib/request-security";
// Compatibility alias: both login URLs use identical checks and rate limits.
export { POST } from "@/app/api/auth/login/route";
export async function GET() {
  const auth = await authorizePlatform();
  return "response" in auth ? auth.response : NextResponse.json({ admin: auth.admin });
}
export async function DELETE(req: NextRequest) {
  try { platformWriteRequest(req); await destroyPlatformSession(); return NextResponse.json({ success: true }); }
  catch (error) { return requestError(error); }
}
