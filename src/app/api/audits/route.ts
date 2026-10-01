import { NextRequest } from "next/server";
import { StaffRole } from "@prisma/client";
import { authorizeApi } from "@/lib/auth";
import { queryAudits } from "@/lib/audit-query";
import { moneyJson } from "@/lib/money";
import { requestError } from "@/lib/request-security";

export async function GET(req: NextRequest) {
  const auth = await authorizeApi([StaffRole.OWNER]);
  if ("response" in auth) return auth.response;
  try { return moneyJson(await queryAudits(auth.user.restaurantId, req.nextUrl.searchParams), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return requestError(error); }
}
