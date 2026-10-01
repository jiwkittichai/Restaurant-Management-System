import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizedEmail, issueAccountToken, consumeAccountToken } from "@/lib/account-tokens";
import { mailConfiguration, sendAccountMail } from "@/lib/account-mail";
import { clientKey, rateLimit, smallJson, requestError, RequestError } from "@/lib/request-security";

export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit("account-token-ip", clientKey(req), 20, 900);
    if (limited) return limited;
    const body = await smallJson(req);
    if (body.action === "verify" || body.action === "reset") {
      const limitedToken = await rateLimit("account-token-consume", String(body.token || "").slice(0, 128), 10, 900);
      if (limitedToken) return limitedToken;
      const result = await consumeAccountToken(body.token, body.action === "verify" ? "VERIFY" : "RESET", body.password);
      return NextResponse.json({
        success: true,
        emailChanged: result.emailChanged,
        message: body.action === "verify"
          ? result.emailChanged ? "เปลี่ยนอีเมลสำเร็จ" : "ยืนยันอีเมลสำเร็จ"
          : "ตั้งรหัสผ่านใหม่แล้ว กรุณาเข้าสู่ระบบอีกครั้ง",
      });
    }
    if (body.action !== "resend" && body.action !== "forgot") throw new RequestError("คำสั่งไม่ถูกต้อง");
    const email = normalizedEmail(body.email);
    const username = typeof body.username === "string" ? body.username.trim().toLowerCase().replace(/^@+/, "") : "";
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) throw new RequestError("กรุณาระบุชื่อผู้ใช้ให้ถูกต้อง");
    mailConfiguration();
    const limitedEmail = await rateLimit("account-mail", `${username}:${email}`, 3, 3600);
    if (limitedEmail) return limitedEmail;
    const employee = await prisma.employee.findUnique({ where: { username } });
    const purpose = body.action === "resend" ? "VERIFY" : "RESET";
    const emailMatches = employee?.email?.trim().toLowerCase() === email;
    if (employee?.active && emailMatches && (purpose === "VERIFY" ? !employee.emailVerifiedAt : Boolean(employee.emailVerifiedAt))) {
      try {
        const token = await issueAccountToken(employee.id, purpose, email);
        await sendAccountMail(email, token, purpose);
      } catch { console.error("Account email delivery failed"); }
    }
    // Same response for unknown, mismatched, inactive and unverified reset requests.
    return NextResponse.json({ success: true, message: "หากอีเมลตรงกับบัญชีที่ทำรายการได้ ระบบจะส่งลิงก์ให้ กรุณาตรวจกล่องอีเมลและสแปม" });
  } catch (error) {
    if (error instanceof RequestError) return requestError(error);
    console.error("Account token operation failed");
    return NextResponse.json({ error: "ทำรายการไม่สำเร็จ กรุณาขอลิงก์ใหม่หรือติดต่อผู้ดูแล" }, { status: 503 });
  }
}
