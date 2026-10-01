import { NextRequest, NextResponse } from "next/server";
import { StaffRole } from "@prisma/client";
import { authorizeApi } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizedEmail, issueAccountToken } from "@/lib/account-tokens";
import { mailConfiguration, sendAccountMail } from "@/lib/account-mail";
import { smallJson, requestError, RequestError } from "@/lib/request-security";

export async function GET() {
  const auth = await authorizeApi([StaffRole.OWNER]);
  if ("response" in auth) return auth.response;
  const employee = await prisma.employee.findUniqueOrThrow({ where: { id: auth.user.id }, select: { email: true, emailVerifiedAt: true } });
  return NextResponse.json(employee);
}

export async function POST(req: NextRequest) {
  const auth = await authorizeApi([StaffRole.OWNER]);
  if ("response" in auth) return auth.response;
  try {
    const body = await smallJson(req);
    const email = normalizedEmail(body.email);
    mailConfiguration();
    const employee = await prisma.employee.findUniqueOrThrow({ where: { id: auth.user.id } });
    const sameEmail = employee.email?.trim().toLowerCase() === email;
    if (employee.emailVerifiedAt && sameEmail) return NextResponse.json({ success: true, message: "อีเมลนี้ยืนยันแล้ว" });
    const token = await issueAccountToken(employee.id, "VERIFY", email);
    const emailChange = Boolean(employee.emailVerifiedAt && !sameEmail);
    await sendAccountMail(email, token, "VERIFY", { emailChange });
    return NextResponse.json({ success: true, message: emailChange ? "ส่งลิงก์ไปยังอีเมลใหม่แล้ว อีเมลในบัญชีจะเปลี่ยนเมื่อยืนยันสำเร็จ" : "ส่งลิงก์ยืนยันอีเมลแล้ว กรุณาตรวจกล่องอีเมลและสแปม" });
  } catch (error) {
    if (error instanceof RequestError) return requestError(error);
    return NextResponse.json({ error: "ส่งอีเมลไม่สำเร็จ กรุณาลองใหม่" }, { status: 503 });
  }
}
