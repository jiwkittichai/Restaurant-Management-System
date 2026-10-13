/**
 * LogList แสดงรายการข้อมูลในส่วนระบบผู้ดูแลแพลตฟอร์ม
 * ใช้รับข้อมูลจากส่วนอื่นและจัดการการโต้ตอบที่จำเป็นบนหน้าจอ
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Filter, RefreshCw, Search, X } from "lucide-react";
import { formatRelativeDate } from "@/app/dashboard/formatters";
import { platformRequest } from "../../_lib/api";
import { logActionTone, logChangeRows, logLabels, logRestaurantName, logSummary, platformAdminName } from "../../_lib/formatters";
import type { PlatformLog } from "../../_lib/types";

type RangeMode = "ALL" | "TODAY" | "7D" | "MONTH" | "YEAR" | "CUSTOM";
type ActionGroup = "" | "RESTAURANT" | "SECURITY" | "SETTINGS";

const actionGroups: Array<{ value: Exclude<ActionGroup, "">; label: string; actions: string[] }> = [
  {
    value: "RESTAURANT",
    label: "การจัดการร้าน",
    actions: ["RESTAURANT_CREATED", "RESTAURANT_APPROVED", "RESTAURANT_REJECTED", "RESTAURANT_SUSPENDED", "RESTAURANT_RESUMED"],
  },
  {
    value: "SECURITY",
    label: "บัญชีและความปลอดภัย",
    actions: ["PLATFORM_LOGIN", "PLATFORM_LOGIN_FAILED", "PLATFORM_ADMIN_CREATED", "PLATFORM_ADMIN_PASSWORD_RESET"],
  },
  {
    value: "SETTINGS",
    label: "ตั้งค่าแพลตฟอร์ม",
    actions: ["PLATFORM_SETTINGS_UPDATED", "PLATFORM_LOGO_UPDATED", "PLATFORM_LOGO_REMOVED"],
  },
];

const rangeOptions: Array<{ value: RangeMode; label: string }> = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "TODAY", label: "วันนี้" },
  { value: "7D", label: "7 วันล่าสุด" },
  { value: "MONTH", label: "เดือนนี้" },
  { value: "YEAR", label: "ปีนี้" },
  { value: "CUSTOM", label: "กำหนดเอง" },
];

function localDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysAgo(amount: number) {
  const date = new Date();
  date.setDate(date.getDate() - amount);
  return localDate(date);
}

export default function LogList() {
  const [logs, setLogs] = useState<PlatformLog[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [actionGroup, setActionGroup] = useState<ActionGroup>("");
  const [rangeMode, setRangeMode] = useState<RangeMode>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = useCallback(async (before?: number) => {
    setLoading(true);
    setError("");
    try {
      const result = await platformRequest<{ logs: PlatformLog[]; nextCursor: number | null }>(`/api/platform/logs${before ? `?before=${before}` : ""}`);
      setLogs(current => before ? [...current, ...result.logs] : result.logs);
      setCursor(result.nextCursor);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("th-TH");
    return logs.filter((log) => {
      const selectedGroup = actionGroups.find(group => group.value === actionGroup);
      if (selectedGroup && !selectedGroup.actions.includes(log.action)) return false;
      const date = localDate(new Date(log.createdAt));
      if (from && date < from) return false;
      if (to && date > to) return false;
      if (!normalizedQuery) return true;
      const restaurantName = logRestaurantName(log.details) || "";
      const details = logChangeRows(log.details).flatMap(row => [row.label, row.before || "", row.after]);
      return [platformAdminName, logLabels[log.action] || log.action, restaurantName, String(log.restaurantId || ""), ...details]
        .some(value => value.toLocaleLowerCase("th-TH").includes(normalizedQuery));
    });
  }, [actionGroup, from, logs, query, to]);

  const hasFilters = Boolean(query.trim() || actionGroup || from || to);

  function setRange(mode: RangeMode) {
    const today = localDate(new Date());
    setRangeMode(mode);
    if (mode === "ALL") { setFrom(""); setTo(""); }
    if (mode === "TODAY") { setFrom(today); setTo(today); }
    if (mode === "7D") { setFrom(daysAgo(6)); setTo(today); }
    if (mode === "MONTH") { setFrom(`${today.slice(0, 7)}-01`); setTo(today); }
    if (mode === "YEAR") { setFrom(`${today.slice(0, 4)}-01-01`); setTo(today); }
    if (mode === "CUSTOM" && !from && !to) {
      const oldest = logs.at(-1);
      setFrom(oldest ? localDate(new Date(oldest.createdAt)) : today);
      setTo(today);
    }
  }

  function clearFilters() {
    setQuery("");
    setActionGroup("");
    setRangeMode("ALL");
    setFrom("");
    setTo("");
  }

  return (
    <section className="space-y-6">
      <section className="rounded-2xl border border-gray-100 bg-white p-5">
        <div>
          <h2 className="font-semibold text-gray-900">ประวัติการดูแลระบบ</h2>
          <p className="mt-1 text-sm text-gray-400">ค้นหาและกรองรายการอนุมัติร้าน การระงับ และการตั้งค่าแพลตฟอร์ม</p>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">ค้นหา</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input value={query} maxLength={100} onChange={event => setQuery(event.target.value)} placeholder="ค้นหาชื่อแอดมิน ร้าน หรือรายละเอียด" className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-400" />
          </label>
          <label className="relative lg:w-72">
            <span className="sr-only">ประเภทกิจกรรม</span>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select value={actionGroup} onChange={event => setActionGroup(event.target.value as ActionGroup)} className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-8 text-sm outline-none focus:border-blue-400">
              <option value="">ทั้งหมด</option>
              {actionGroups.map(group => <option key={group.value} value={group.value}>{group.label}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="sm:w-56">
              <span className="mb-1 block text-xs text-gray-400">แสดง</span>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select value={rangeMode} onChange={event => setRange(event.target.value as RangeMode)} className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-8 text-sm outline-none focus:border-blue-400">
                  {rangeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </div>
            </label>
            <label className="sm:w-44">
              <span className="mb-1 block text-xs text-gray-400">จาก</span>
              <input type="date" value={from} onChange={event => { setRangeMode("CUSTOM"); setFrom(event.target.value); }} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-400" />
            </label>
            <label className="sm:w-44">
              <span className="mb-1 block text-xs text-gray-400">ถึง</span>
              <input type="date" value={to} onChange={event => { setRangeMode("CUSTOM"); setTo(event.target.value); }} className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-400" />
            </label>
          </div>
          {hasFilters && <button type="button" onClick={clearFilters} className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600"><X size={15} />ล้างตัวกรอง</button>}
        </div>
      </section>

      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">รายการประวัติ</h2>
            <p role="status" className="mt-1 text-sm text-gray-400">{loading && !logs.length ? "กำลังโหลดประวัติ..." : `พบ ${filteredLogs.length.toLocaleString("th-TH")} จาก ${logs.length.toLocaleString("th-TH")} รายการที่โหลด`}</p>
          </div>
          <button type="button" disabled={loading} onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""} />รีเฟรช</button>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredLogs.map((log) => {
            const changes = logChangeRows(log.details);
            return (
              <Link key={log.id} href={`/platform/logs/${log.id}`} className="block w-full px-5 py-4 text-left transition hover:bg-gray-50">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">{platformAdminName}</span>
                      <span className={`rounded-full px-2.5 py-1 text-xs ${logActionTone(log.action)}`}>{logLabels[log.action] || log.action}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{logSummary(log)}</p>
                  </div>
                  <time dateTime={log.createdAt} title={new Date(log.createdAt).toLocaleString("th-TH")} className="whitespace-nowrap text-sm text-gray-400">{formatRelativeDate(log.createdAt)}</time>
                </div>

                {changes.length > 0 && (
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {changes.slice(0, 4).map((row, index) => (
                      <div key={`${log.id}-${row.label}-${index}`} className="rounded-lg bg-gray-50 px-3 py-2 text-xs">
                        <p className="font-medium text-gray-600">{row.label}</p>
                        <p className="mt-1 break-words text-gray-400">{row.before !== undefined ? `${row.before} → ${row.after || "-"}` : row.after}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Link>
            );
          })}
          {!filteredLogs.length && !loading && <p className="px-5 py-8 text-center text-sm text-gray-400">{hasFilters ? "ไม่พบรายการที่ตรงกับตัวกรอง" : "ยังไม่มีรายการ"}</p>}
          {loading && !logs.length && <p className="px-5 py-8 text-center text-sm text-gray-400">กำลังโหลดประวัติ...</p>}
        </div>

        {cursor && (
          <div className="border-t border-gray-100 p-4 text-center">
            <button type="button" disabled={loading} onClick={() => void load(cursor)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600 disabled:opacity-50">{loading ? "กำลังโหลด..." : "ดูรายการก่อนหน้า"}</button>
          </div>
        )}
      </section>
    </section>
  );
}
