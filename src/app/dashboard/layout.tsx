/**
 * โครงหน้าที่ใช้ร่วมกันในแดชบอร์ดร้านอาหาร
 * ใช้ตรวจข้อมูลที่จำเป็นและวางส่วนประกอบร่วมก่อนแสดงหน้าด้านใน
 */

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardShell from "./_components/DashboardShell";
import RoleBoundary from "./_components/RoleBoundary";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const restaurant = await prisma.restaurant.findUnique({ where: { id: user.restaurantId }, select: { name: true } });
  return (
    <DashboardShell user={user} restaurantName={restaurant?.name}>
      <RoleBoundary roles={user.roles}>{children}</RoleBoundary>
    </DashboardShell>
  );
}
