import GuestOrder from "./GuestOrder";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const session = await prisma.tableSession.findUnique({ where: { token }, select: { closedAt: true, table: { select: { restaurant: { select: { name: true } } } } } });
  return { title: session && !session.closedAt ? `${session.table.restaurant.name} · สั่งอาหาร` : "สั่งอาหารที่โต๊ะ", robots: { index: false, follow: false }, referrer: "no-referrer" };
}
export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <GuestOrder token={token} />;
}
