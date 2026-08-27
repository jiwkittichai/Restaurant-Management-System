"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Filter, Search, X } from "lucide-react";
import { Audit, actionText, auditChangeRows, auditDetailRows, auditSummary, formatDate } from "../audit-utils";

type AuditMeta = {
  totalCount: number;
  oldestAt?: string;
  latestAt?: string;
  limit: number;
};

type RangeMode = "ALL" | "TODAY" | "7D" | "MONTH" | "CUSTOM";
const allActionsValue = "__ALL__";

function localDate(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function monthStart(date = new Date()) {
  return localDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return localDate(date);
}

export default function AuditsClient({ initialAudits, initialMeta }: { initialAudits: Audit[]; initialMeta: AuditMeta }) {
  const didRenderInitialData = useRef(false);
  const [audits, setAudits] = useState<Audit[]>(initialAudits);
  const [meta, setMeta] = useState<AuditMeta | null>(initialMeta);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("");
  const [rangeMode, setRangeMode] = useState<RangeMode>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (action === allActionsValue) {
      params.set("scope", "all");
    } else if (action) {
      params.set("action", action);
    }
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const response = await fetch(`/api/audits?${params.toString()}`);
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(data.error || "โหลดประวัติไม่สำเร็จ");
    setAudits(data.audits);
    setMeta(data.meta);
  }, [action, from, query, to]);

  useEffect(() => {
    if (!didRenderInitialData.current) {
      didRenderInitialData.current = true;
      return;
    }
    const timeout = window.setTimeout(load, 250);
    return () => window.clearTimeout(timeout);
  }, [load]);

  const actionOptions = useMemo(() => Object.entries(actionText).sort((a, b) => a[1].localeCompare(b[1], "th")), []);
  const hasFilters = Boolean(query.trim() || action || from || to);
  const todayValue = localDate(new Date());
  const oldestValue = meta?.oldestAt ? localDate(new Date(meta.oldestAt)) : "";
  const visibleFrom = from || oldestValue;
  const visibleTo = to || todayValue;
  const resultText = audits.length === (meta?.totalCount ?? audits.length)
      ? `พบ ${audits.length} รายการ`
      : `แสดง ${audits.length} จาก ${meta?.totalCount ?? audits.length} รายการ`;

  function clearFilters() {
    setQuery("");
    setAction("");
    setRangeMode("ALL");
    setFrom("");
    setTo("");
  }

  function setRange(mode: RangeMode) {
    const today = localDate(new Date());
    setRangeMode(mode);
    if (mode === "ALL") {
      setFrom("");
      setTo("");
    }
    if (mode === "TODAY") {
      setFrom(today);
      setTo(today);
    }
    if (mode === "7D") {
      setFrom(daysAgo(6));
      setTo(today);
    }
    if (mode === "MONTH") {
      setFrom(monthStart());
      setTo(today);
    }
    if (mode === "CUSTOM" && !from && !to) {
      setFrom(oldestValue || today);
      setTo(today);
    }
  }

  const rangeOptions: Array<{ value: RangeMode; label: string }> = [
    { value: "ALL", label: "ทั้งหมด" },
    { value: "TODAY", label: "วันนี้" },
    { value: "7D", label: "7 วันล่าสุด" },
    { value: "MONTH", label: "เดือนนี้" },
    { value: "CUSTOM", label: "กำหนดเอง" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
      <section className="bg-white rounded-2xl border border-gray-100 p-5">
        <div>
          <h2 className="font-semibold text-gray-900">ประวัติกิจกรรม</h2>
          <p className="mt-1 text-sm text-gray-400">ค้นหาและกรองประวัติย้อนหลังของร้าน</p>
        </div>

        <div className="mt-5 flex flex-col gap-3 lg:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">ค้นหา</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาชื่อพนักงาน เลขออเดอร์ หรือรายละเอียด"
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-400"
            />
          </label>
          <label className="relative lg:w-64">
            <span className="sr-only">ประเภทกิจกรรม</span>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={action}
              onChange={(event) => setAction(event.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-8 text-sm outline-none focus:border-blue-400"
            >
              <option value="">กิจกรรมสำคัญ</option>
              <option value={allActionsValue}>ทั้งหมด</option>
              {actionOptions.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="sm:w-56">
              <span className="mb-1 block text-xs text-gray-400">แสดง</span>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select
                  value={rangeMode}
                  onChange={(event) => setRange(event.target.value as RangeMode)}
                  className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-8 text-sm outline-none focus:border-blue-400"
                >
                  {rangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </label>
            <label className="sm:w-44">
              <span className="mb-1 block text-xs text-gray-400">จาก</span>
              <input
                type="date"
                value={visibleFrom}
                disabled={!from && !oldestValue}
                onChange={(event) => {
                  setRangeMode("CUSTOM");
                  setFrom(event.target.value);
                  if (!to) setTo(visibleTo);
                }}
                className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </label>
            <label className="sm:w-44">
              <span className="mb-1 block text-xs text-gray-400">ถึง</span>
              <input
                type="date"
                value={visibleTo}
                onChange={(event) => {
                  setRangeMode("CUSTOM");
                  setTo(event.target.value);
                  if (!from) setFrom(visibleFrom);
                }}
                className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
              />
            </label>
          </div>
          {hasFilters && (
            <button type="button" onClick={clearFilters} className="inline-flex w-fit items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600">
              <X size={15} />
              ล้างตัวกรอง
            </button>
          )}
        </div>

      </section>

      {message && <p className="text-sm text-red-500">{message}</p>}

      <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">รายการประวัติ</h2>
            <p className="mt-1 text-sm text-gray-400">{resultText}</p>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {audits.map((audit) => {
            const changes = auditChangeRows(audit);
            return (
              <button key={audit.id} onClick={() => setSelected(audit)} className="block w-full px-5 py-4 text-left hover:bg-gray-50">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">{audit.employee?.displayName || "บัญชีที่ถูกลบ"}</span>
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-600">{actionText[audit.action] || audit.action}</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-600">{auditSummary(audit)}</p>
                    {changes.length > 0 && (
                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {changes.slice(0, 4).map((row) => (
                          <div key={`${audit.id}-${row.label}`} className="rounded-lg bg-gray-50 px-3 py-2 text-xs">
                            <p className="font-medium text-gray-600">{row.label}</p>
                            <p className="mt-1 text-gray-400">{row.before ? `${row.before} -> ${row.after || "-"}` : row.after}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-400 whitespace-nowrap">{formatDate(audit.createdAt)}</span>
                </div>
              </button>
            );
          })}
          {!audits.length && !loading && <p className="px-5 py-8 text-center text-sm text-gray-400">ไม่พบประวัติตามเงื่อนไขที่เลือก</p>}
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
          <button type="button" aria-label="ปิดรายละเอียดประวัติ" className="hidden flex-1 cursor-default sm:block" onClick={() => setSelected(null)} />
          <div className="h-full w-full overflow-y-auto bg-white p-5 shadow-2xl sm:max-w-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="font-semibold text-gray-900">รายละเอียดประวัติ</h2>
                <p className="mt-1 text-sm text-gray-400">{auditSummary(selected)}</p>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <div className="grid gap-2">
                {auditDetailRows(selected).map((row) => (
                  <div key={row.label} className="rounded-xl border border-gray-100 px-4 py-3">
                    <p className="text-xs text-gray-400">{row.label}</p>
                    <p className="mt-1 text-sm font-medium text-gray-800">{row.value}</p>
                  </div>
                ))}
              </div>

              {auditChangeRows(selected).length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900">ค่าที่เปลี่ยนแปลง</h3>
                  <div className="mt-2 grid gap-2">
                    {auditChangeRows(selected).map((row) => (
                      <div key={row.label} className="rounded-xl border border-gray-100 px-4 py-3 text-sm">
                        <p className="font-medium text-gray-800">{row.label}</p>
                        <p className="mt-1 text-gray-500">{row.before ? `${row.before} -> ${row.after || "-"}` : row.after}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
