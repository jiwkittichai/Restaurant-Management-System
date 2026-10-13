/**
 * หน้าเริ่มต้นของระบบ ตรวจสถานะการเข้าสู่ระบบของผู้ใช้
 * ใช้ส่งผู้ดูแล พนักงาน และผู้ที่ยังไม่เข้าสู่ระบบไปยังหน้าที่เหมาะสม
 */

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  redirect((await getCurrentUser()) ? "/dashboard" : "/login");
}
