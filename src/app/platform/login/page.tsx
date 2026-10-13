/**
 * เส้นทางเข้าสู่ระบบเดิมของผู้ดูแลแพลตฟอร์ม
 * ใช้ส่งผู้ใช้ไปยังหน้าเข้าสู่ระบบกลางเพื่อไม่ให้มีหน้าซ้ำกัน
 */

import { redirect } from "next/navigation";
export default function Page() { redirect("/login"); }
