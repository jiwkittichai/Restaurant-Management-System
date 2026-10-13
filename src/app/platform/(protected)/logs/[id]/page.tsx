/**
 * หน้ารายละเอียดกิจกรรมของผู้ดูแลแพลตฟอร์ม
 * ใช้เตรียมพารามิเตอร์และตรวจสิทธิ์บนเซิร์ฟเวอร์ก่อนส่งข้อมูลไปแสดงผล
 */

import { notFound, redirect } from "next/navigation";
import { getPlatformAdmin } from "@/lib/platform";
import { prisma } from "@/lib/prisma";
import type { PlatformLog } from "../../_lib/types";
import PlatformLogDetail from "./_components/PlatformLogDetail";

export default async function PlatformLogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getPlatformAdmin();
  if (!admin) redirect("/login");

  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const result = await prisma.platformLog.findUnique({
    where: { id },
    select: { id: true, actorName: true, action: true, restaurantId: true, details: true, createdAt: true },
  });
  if (!result) notFound();

  const log: PlatformLog = { ...result, createdAt: result.createdAt.toISOString() };
  return <PlatformLogDetail log={log} />;
}
