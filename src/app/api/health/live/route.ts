/**
 * API สำหรับตรวจสอบว่าแอปพลิเคชันยังทำงานอยู่ รองรับ GET
 * ใช้ตรวจข้อมูลจากคำขอ ติดต่อฐานข้อมูลหรือบริการที่เกี่ยวข้อง แล้วส่งผลลัพธ์กลับให้หน้าจอ
 */

import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export function GET() {
  return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
