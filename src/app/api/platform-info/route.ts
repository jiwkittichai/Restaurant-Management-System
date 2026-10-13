/**
 * API สำหรับข้อมูลสาธารณะของแพลตฟอร์ม รองรับ GET
 * ใช้ตรวจข้อมูลจากคำขอ ติดต่อฐานข้อมูลหรือบริการที่เกี่ยวข้อง แล้วส่งผลลัพธ์กลับให้หน้าจอ
 */

import { NextResponse } from "next/server";
import { platformSettings } from "@/lib/platform";
export async function GET() {
  const settings = await platformSettings();
  return NextResponse.json({ name: settings.name, logoUrl: settings.logoUrl ? `/api/platform/logo?v=${settings.updatedAt.getTime()}` : null, registrationOpen: settings.registrationOpen }, { headers: { "Cache-Control": "no-store" } });
}
