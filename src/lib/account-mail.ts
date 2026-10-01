import "server-only";
import nodemailer from "nodemailer";
import { RequestError } from "@/lib/request-security";

export function mailConfiguration() {
  const host = process.env.SMTP_HOST;
  const from = process.env.SMTP_FROM;
  const configuredUrl = process.env.AUTH_PUBLIC_URL;
  if (!host || !from || !configuredUrl) throw new RequestError("ยังไม่ได้ตั้งค่าบริการอีเมล กรุณาติดต่อผู้ดูแลระบบ", 503);
  const url = new URL(configuredUrl);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) || url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new RequestError("การตั้งค่า URL อีเมลไม่ถูกต้อง", 503);
  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new RequestError("การตั้งค่า SMTP ไม่ถูกต้อง", 503);
  return { host, from, origin: url.origin, port };
}

export async function sendAccountMail(email: string, token: string, purpose: "VERIFY" | "RESET", options?: { emailChange?: boolean }) {
  const config = mailConfiguration();
  const secure = config.port === 465;
  const localRelay = ["localhost", "127.0.0.1", "::1"].includes(config.host);
  const transport = nodemailer.createTransport({
    host: config.host, port: config.port, secure, requireTLS: !secure && !localRelay,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    disableFileAccess: true, disableUrlAccess: true,
  });
  // Fragment is not sent in page requests or Referer headers; consume only by POST.
  const verificationContext = purpose === "VERIFY" && options?.emailChange ? "?context=change" : "";
  const link = `${config.origin}/${purpose === "VERIFY" ? "verify-email" : "reset-password"}${verificationContext}#token=${token}`;
  const title = purpose === "VERIFY" ? (options?.emailChange ? "ยืนยันอีเมลใหม่" : "ยืนยันอีเมลบัญชีร้านอาหาร") : "คำขอตั้งรหัสผ่านใหม่";
  const expiresIn = purpose === "VERIFY" ? "24 ชั่วโมง" : "30 นาที";
  const text = purpose === "RESET"
    ? `เรียน ผู้ใช้งาน PromRaan\n\nเราได้รับคำขอตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ กรุณาเปิดลิงก์ด้านล่างเพื่อดำเนินการ\n\n${link}\n\nลิงก์นี้ใช้ได้เพียงครั้งเดียวและจะหมดอายุภายใน ${expiresIn}\nหากคุณไม่ได้เป็นผู้ส่งคำขอนี้ สามารถละเว้นอีเมลฉบับนี้ได้ และโปรดอย่าเผยแพร่ลิงก์แก่ผู้อื่น\n\nขอแสดงความนับถือ\nทีมงาน PromRaan`
    : `${title}\n\nกรุณาเปิดลิงก์ด้านล่างเพื่อดำเนินการ\n\n${link}\n\nลิงก์นี้ใช้ได้เพียงครั้งเดียวและจะหมดอายุภายใน ${expiresIn}\nหากคุณไม่ได้เป็นผู้ส่งคำขอนี้ สามารถละเว้นอีเมลฉบับนี้ได้ และโปรดอย่าเผยแพร่ลิงก์แก่ผู้อื่น\n\nทีมงาน PromRaan`;
  try {
    const info = await transport.sendMail({ from: config.from, to: email, subject: title,
      text,
    });
    if (!info.accepted.length) throw new Error("MAIL_NOT_ACCEPTED");
  } finally { transport.close(); }
}
