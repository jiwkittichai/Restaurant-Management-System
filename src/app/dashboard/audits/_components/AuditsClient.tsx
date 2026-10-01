"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Audit, actionText, auditActorName, auditChangeRows, auditSummary, formatDate } from "../utils";
import AuditFilters, { allActionsValue } from "./AuditFilters";
import { daysAgo, localDate, monthStart } from "../date-utils";
import type { AuditMeta, AuditsClientProps, RangeMode } from "../types";

export default function AuditsClient({
  initialAudits,
  initialMeta,
  employeeId,
  title = "ประวัติกิจกรรม",
  description = "ค้นหาและกรองประวัติย้อนหลังของร้าน",
  backHref,
  backLabel = "กลับ",
  employeeSummary = [],
}: AuditsClientProps) {
  const didRenderInitialData = useRef(false);
  const [audits, setAudits] = useState<Audit[]>(initialAudits);
  const [meta, setMeta] = useState<AuditMeta | null>(initialMeta);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("");
  const [rangeMode, setRangeMode] = useState<RangeMode>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (action === allActionsValue) params.set("scope", "all");
  else if (action) params.set("group", action);
  if (employeeId) params.set("employeeId", String(employeeId));
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const filterKey = params.toString();
  const [pages, setPages] = useState({ key: filterKey, cursors: [""], index: 0 });
  const pageIndex = pages.key === filterKey ? pages.index : 0;
  const cursors = pages.key === filterKey ? pages.cursors : [""];
  if (cursors[pageIndex]) params.set("before", cursors[pageIndex]);
  const requestKey = params.toString();
  const [loadedKey, setLoadedKey] = useState(requestKey);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    setPages(current => current.key === filterKey ? current : { key: filterKey, cursors: [""], index: 0 });
  }, [filterKey]);

  useEffect(() => {
    if (!didRenderInitialData.current) {
      didRenderInitialData.current = true;
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setMessage("");
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/audits?${requestKey}`, { signal: controller.signal, cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "โหลดประวัติไม่สำเร็จ");
        if (!controller.signal.aborted) { setAudits(data.audits); setMeta(data.meta); setLoadedKey(requestKey); }
      } catch (error) {
        if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "เชื่อมต่อไม่สำเร็จ");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [requestKey, refresh]);
  const pending = loading || loadedKey !== requestKey;
  const showPagination = !pending && Boolean(meta) && (pageIndex > 0 || Boolean(meta?.nextCursor));

  const hasFilters = Boolean(query.trim() || action || from || to);
  const todayValue = localDate(new Date());
  const oldestValue = meta?.oldestAt ? localDate(new Date(meta.oldestAt)) : "";
  const visibleFrom = from || oldestValue;
  const visibleTo = to || todayValue;
  const rangeStart = audits.length > 0 ? pageIndex * (meta?.limit ?? 100) + 1 : 0;
  const rangeEnd = audits.length > 0 ? rangeStart + audits.length - 1 : 0;
  const pageRangeText = audits.length > 0
    ? `รายการ ${rangeStart.toLocaleString()}–${rangeEnd.toLocaleString()} จาก ${(meta?.totalCount ?? 0).toLocaleString()}`
    : "0 รายการ";
  const resultText = pageRangeText;

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

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
      {backHref && (
        <Link href={backHref} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600">
          <ArrowLeft size={17} />
          {backLabel}
        </Link>
      )}

      {employeeSummary.length > 0 && (
        <section className="grid gap-3 rounded-2xl border border-gray-100 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4">
          {employeeSummary.map((item) => (
            <div key={item.label} className="min-w-0 rounded-xl border border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className={`mt-1 break-words font-semibold leading-snug ${item.accent || "text-gray-900"}`}>{item.value}</p>
            </div>
          ))}
        </section>
      )}

      <AuditFilters
        title={title}
        description={description}
        query={query}
        action={action}
        rangeMode={rangeMode}
        visibleFrom={visibleFrom}
        visibleTo={visibleTo}
        fromDisabled={!from && !oldestValue}
        hasFilters={hasFilters}
        onQuery={setQuery}
        onAction={setAction}
        onRange={setRange}
        onFrom={value => { setRangeMode("CUSTOM"); setFrom(value); if (!to) setTo(visibleTo); }}
        onTo={value => { setRangeMode("CUSTOM"); setTo(value); if (!from) setFrom(visibleFrom); }}
        onClear={clearFilters}
      />

      {message && <p role="alert" className="text-sm text-red-500">{message}</p>}

      <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">รายการประวัติ</h2>
            <p role="status" className="mt-1 text-sm text-gray-400">{loading ? "กำลังโหลดประวัติ..." : message ? "โหลดไม่สำเร็จ กดรีเฟรชเพื่อลองอีกครั้ง" : resultText}</p>
          </div>
          <button disabled={loading} onClick={() => { setPages({ key: filterKey, cursors: [""], index: 0 }); setRefresh(value => value + 1); }} className="rounded-xl border border-gray-200 px-4 py-2 text-sm disabled:opacity-50">รีเฟรช</button>
        </div>

        <div className="divide-y divide-gray-100">
          {audits.map((audit) => {
            const changes = auditChangeRows(audit);
            return (
              <Link key={audit.id} href={`/dashboard/audits/${audit.id}${employeeId ? `?employeeId=${employeeId}` : ""}`} aria-disabled={pending} onClick={event => { if (pending) event.preventDefault(); }} className={`block w-full px-5 py-4 text-left hover:bg-gray-50 ${pending ? "pointer-events-none opacity-40" : ""}`}>
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">{auditActorName(audit)}</span>
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
              </Link>
            );
          })}
          {!audits.length && !loading && (
            <p className="px-5 py-8 text-center text-sm text-gray-400">
              ไม่พบรายการ
            </p>
          )}
        </div>
        {showPagination && <div className="flex items-center justify-between border-t border-gray-100 p-4 text-sm">
          <button disabled={pending || pageIndex === 0} onClick={() => setPages({ key: filterKey, cursors, index: pageIndex - 1 })} className="rounded-xl border border-gray-200 px-4 py-2 disabled:opacity-40">ก่อนหน้า</button>
          <span>{pageRangeText}</span>
          <button disabled={pending || !meta?.nextCursor} onClick={() => { if (meta?.nextCursor) setPages({ key: filterKey, cursors: [...cursors.slice(0, pageIndex + 1), meta.nextCursor], index: pageIndex + 1 }); }} className="rounded-xl border border-gray-200 px-4 py-2 disabled:opacity-40">ถัดไป</button>
        </div>}
      </section>
    </div>
  );
}
