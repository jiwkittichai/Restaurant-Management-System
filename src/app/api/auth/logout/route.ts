import { NextResponse } from "next/server";
import { destroySession, getCurrentUser, writeAudit } from "@/lib/auth";

export async function POST() {
  const user = await getCurrentUser();
  if (user) await writeAudit(user.id, "LOGOUT", "Employee", user.id);
  await destroySession();
  return NextResponse.json({ success: true });
}
