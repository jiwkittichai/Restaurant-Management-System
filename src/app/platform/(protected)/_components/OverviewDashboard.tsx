"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Building2, CircleCheck, CircleX, History, Store, Users } from "lucide-react";
import { platformRequest } from "../_lib/api";
import { logLabels, logRestaurantName } from "../_lib/formatters";
import type { PlatformLog, RestaurantList } from "../_lib/types";

export default function OverviewDashboard() {
  const [overview, setOverview] = useState<RestaurantList | null>(null);
  const [logs, setLogs] = useState<PlatformLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([
      platformRequest<RestaurantList>("/api/platform/restaurants"),
      platformRequest<{ logs: PlatformLog[] }>("/api/platform/logs"),
    ]).then(([restaurants, activity]) => {
      if (!alive) return;
      setOverview(restaurants);
      setLogs(activity.logs.slice(0, 5));
    }).catch(caught => { if (alive) setError((caught as Error).message); });
    return () => { alive = false; };
  }, []);

  const cards = overview ? [
    { label: "ร้านทั้งหมด", value: overview.summary.restaurants, icon: Building2, tone: "bg-blue-50 text-blue-600" },
    { label: "รออนุมัติ", value: overview.summary.pending, icon: History, tone: "bg-amber-50 text-amber-600" },
    { label: "เปิดใช้งาน", value: overview.summary.active, icon: CircleCheck, tone: "bg-emerald-50 text-emerald-600" },
    { label: "ระงับ / ไม่อนุมัติ", value: overview.summary.suspended + overview.summary.rejected, icon: CircleX, tone: "bg-red-50 text-red-500" },
  ] : [];

  return (
    <section className="space-y-5">
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {!overview && !error && <p className="rounded-2xl bg-white p-6 text-sm text-gray-400">กำลังโหลดข้อมูลภาพรวม...</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => <article key={label} className="rounded-2xl border border-gray-100 bg-white p-5"><div className="flex items-center justify-between"><span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}><Icon size={21} /></span><span className="text-2xl font-semibold text-gray-900">{value.toLocaleString("th-TH")}</span></div><p className="mt-4 text-sm text-gray-500">{label}</p></article>)}
      </div>
      {overview && <div className="grid gap-4 sm:grid-cols-2"><article className="rounded-2xl border border-gray-100 bg-white p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600"><Users size={19} /></span><p className="mt-3 text-sm text-gray-400">บัญชีผู้ใช้ทั้งหมด</p><p className="mt-1 text-2xl font-semibold">{overview.summary.employees.toLocaleString("th-TH")}</p></article><article className="rounded-2xl border border-gray-100 bg-white p-5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-600"><Store size={19} /></span><p className="mt-3 text-sm text-gray-400">ออเดอร์สะสม</p><p className="mt-1 text-2xl font-semibold">{overview.summary.orders.toLocaleString("th-TH")}</p></article></div>}
      <article className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 p-5"><div><h2 className="font-semibold">กิจกรรมล่าสุด</h2><p className="mt-1 text-sm text-gray-400">การดำเนินการของผู้ดูแลแพลตฟอร์ม</p></div><Link href="/platform/logs" className="text-sm font-medium text-blue-600 hover:underline">ดูทั้งหมด</Link></div>
        <div className="divide-y divide-gray-100">{logs.map(log => { const restaurantName = logRestaurantName(log.details); return <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 p-5"><div><p className="text-sm font-medium text-gray-800">{logLabels[log.action] || log.action}{restaurantName ? ` · ${restaurantName}` : ""}</p><p className="mt-1 text-xs text-gray-400">โดย {log.actorName}</p></div><time className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString("th-TH")}</time></div>; })}{logs.length === 0 && overview && <p className="p-5 text-sm text-gray-400">ยังไม่มีกิจกรรม</p>}</div>
      </article>
    </section>
  );
}
