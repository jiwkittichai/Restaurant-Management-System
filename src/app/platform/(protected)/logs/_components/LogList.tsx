"use client";

import { useCallback, useEffect, useState } from "react";
import { platformRequest } from "../../_lib/api";
import { logDetailGroups, logLabels, logRestaurantName } from "../../_lib/formatters";
import type { PlatformLog } from "../../_lib/types";

export default function LogList() {
  const [logs, setLogs] = useState<PlatformLog[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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

  return <section className="space-y-4"><div className="rounded-2xl border border-gray-100 bg-white p-5"><h2 className="font-semibold text-gray-900">ประวัติการดูแลแพลตฟอร์ม</h2><p className="mt-1 text-sm text-gray-400">รายการอนุมัติร้าน การระงับ และการตั้งค่าระบบ</p></div>{error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}<div className="overflow-hidden rounded-2xl border border-gray-100 bg-white"><div className="divide-y divide-gray-100">{logs.map(log => { const groups = logDetailGroups(log.details); const restaurantName = logRestaurantName(log.details); return <article key={log.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium text-gray-900">{logLabels[log.action] || log.action}{restaurantName ? ` · ${restaurantName}` : log.restaurantId ? ` · ร้าน #${log.restaurantId}` : ""}</p>{log.restaurantId && restaurantName && <p className="mt-1 text-xs text-gray-400">รหัสร้าน #{log.restaurantId}</p>}</div><time className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString("th-TH")}</time></div><p className="mt-2 text-sm text-gray-400">ดำเนินการโดย {log.actorName}</p>{groups.length > 0 && <div className="mt-4 space-y-3 rounded-xl bg-gray-50 p-4">{groups.map((group, index) => <div key={`${group.label || "details"}-${index}`}>{group.label && <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{group.label}</p>}<dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">{group.rows.map(row => <div key={row.label} className="min-w-0"><dt className="text-xs text-gray-400">{row.label}</dt><dd className="mt-1 break-words text-sm font-medium text-gray-700">{row.value}</dd></div>)}</dl></div>)}</div>}</article>; })}{!logs.length && !loading && <p className="p-6 text-sm text-gray-400">ยังไม่มีรายการ</p>}{loading && !logs.length && <p className="p-6 text-sm text-gray-400">กำลังโหลดประวัติ...</p>}</div></div>{cursor && <button type="button" disabled={loading} onClick={() => void load(cursor)} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 disabled:opacity-50">{loading ? "กำลังโหลด..." : "ดูรายการก่อนหน้า"}</button>}</section>;
}
