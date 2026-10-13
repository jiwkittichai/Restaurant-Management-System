/**
 * โครงหน้าที่ใช้ร่วมกันในระบบผู้ดูแลแพลตฟอร์ม
 * ใช้ตรวจข้อมูลที่จำเป็นและวางส่วนประกอบร่วมก่อนแสดงหน้าด้านใน
 */

import { redirect } from "next/navigation";
import { getPlatformAdmin } from "@/lib/platform";
import PlatformShell from "./_components/PlatformShell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const admin = await getPlatformAdmin();
  if (!admin) redirect("/login");
  return <PlatformShell>{children}</PlatformShell>;
}
