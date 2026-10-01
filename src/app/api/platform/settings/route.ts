import { NextRequest, NextResponse } from "next/server";
import { authorizePlatform, platformSettings, platformWriteRequest, platformLog } from "@/lib/platform";
import { prisma } from "@/lib/prisma";
import { smallJson, RequestError, requestError } from "@/lib/request-security";
export async function GET() {
  const auth = await authorizePlatform(); if ("response" in auth) return auth.response;
  return NextResponse.json(await platformSettings());
}
export async function PATCH(req: NextRequest) {
  const auth = await authorizePlatform(); if ("response" in auth) return auth.response;
  try {
    platformWriteRequest(req);
    const body = await smallJson(req);
    if (typeof body.name !== "string" || !body.name.trim() || body.name.length > 100 || typeof body.registrationOpen !== "boolean") throw new RequestError("กรุณาระบุชื่อแพลตฟอร์มและสถานะรับสมัคร");
    const settings = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM PlatformSettings WHERE id = 1 FOR UPDATE`;
      const before = await tx.platformSettings.findUniqueOrThrow({ where: { id: 1 } });
      const updated = await tx.platformSettings.update({ where: { id: 1 }, data: { name: body.name.trim(), registrationOpen: body.registrationOpen } });
      await platformLog(tx, auth.admin, "PLATFORM_SETTINGS_UPDATED", undefined, { before: { name: before.name, registrationOpen: before.registrationOpen }, after: { name: updated.name, registrationOpen: updated.registrationOpen } });
      return updated;
    });
    return NextResponse.json(settings);
  } catch (error) { return requestError(error); }
}
