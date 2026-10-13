/**
 * API สำหรับการออกจากระบบของพนักงาน รองรับ POST
 * ใช้ตรวจข้อมูลจากคำขอ ติดต่อฐานข้อมูลหรือบริการที่เกี่ยวข้อง แล้วส่งผลลัพธ์กลับให้หน้าจอ
 */

import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST() {
  await destroySession();
  return NextResponse.json({ success: true });
}
