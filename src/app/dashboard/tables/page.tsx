/**
 * หน้าสำหรับโต๊ะและออเดอร์ภายในร้าน
 * ใช้เตรียมพารามิเตอร์และตรวจสิทธิ์บนเซิร์ฟเวอร์ก่อนส่งข้อมูลไปแสดงผล
 */

import TablesPageClient from "./_components/TablesPageClient";
import { getCurrentUser } from "@/lib/auth";

export default async function TablesPage() {
  const user = await getCurrentUser();
  return <TablesPageClient canManageTables={Boolean(user?.roles.includes("OWNER"))} />;
}
