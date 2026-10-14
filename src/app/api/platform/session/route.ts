/**
 * API สำหรับการเข้าสู่ระบบของผู้ดูแลแพลตฟอร์ม รองรับ POST, GET, DELETE
 * ใช้ตรวจข้อมูลจากคำขอ ติดต่อฐานข้อมูลหรือบริการที่เกี่ยวข้อง แล้วส่งผลลัพธ์กลับให้หน้าจอ
 */

import { NextRequest, NextResponse } from "next/server";
import { authorizePlatform, destroyPlatformSession, platformWriteRequest } from "@/lib/platform";
import { requestError } from "@/lib/request-security";
export { POST } from "@/app/api/auth/login/route";
export async function GET() {
  const auth = await authorizePlatform();
  return "response" in auth ? auth.response : NextResponse.json({ admin: auth.admin });
}
export async function DELETE(req: NextRequest) {
  try { platformWriteRequest(req); await destroyPlatformSession(); return NextResponse.json({ success: true }); }
  catch (error) { return requestError(error); }
}
