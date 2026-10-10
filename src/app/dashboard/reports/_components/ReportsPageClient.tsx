"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { emptyReport, type RangeMode, type Report } from "../types";
import { daysAgoText, localDate, monthStartText, todayText, yearStartText } from "../utils";
import OrdersReportTable from "./OrdersReportTable";
import ReportRangeFilter from "./ReportRangeFilter";
import ReportSummaryCards from "./ReportSummaryCards";
import SalesChart from "./SalesChart";

export default function ReportsPageClient() {
  const router = useRouter();
  const [rangeMode, setRangeMode] = useState<RangeMode>("TODAY");
  const [from, setFrom] = useState(() => todayText());
  const [to, setTo] = useState(() => todayText());
  const [report, setReport] = useState<Report>(emptyReport);

  const reportQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (rangeMode === "ALL") params.set("range", "all");
    else {
      params.set("from", from);
      params.set("to", to);
    }
    params.set("mode", rangeMode);
    return params.toString();
  }, [from, rangeMode, to]);

  const load = useCallback(
    () => fetch(`/api/reports?${reportQuery}`).then((response) => response.json()).then(setReport),
    [reportQuery],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function syncLatestDate() {
      const latest = todayText();
      if (rangeMode === "ALL" || rangeMode === "CUSTOM" || to === latest) return;
      if (rangeMode === "TODAY") {
        setFrom(latest);
        setTo(latest);
      }
      if (rangeMode === "7D") {
        setFrom(daysAgoText(6));
        setTo(latest);
      }
      if (rangeMode === "MONTH") {
        setFrom(monthStartText(new Date()));
        setTo(latest);
      }
      if (rangeMode === "YEAR") {
        setFrom(yearStartText(new Date()));
        setTo(latest);
      }
    }

    window.addEventListener("focus", syncLatestDate);
    document.addEventListener("visibilitychange", syncLatestDate);
    return () => {
      window.removeEventListener("focus", syncLatestDate);
      document.removeEventListener("visibilitychange", syncLatestDate);
    };
  }, [rangeMode, to]);

  const allFromValue = report.meta.oldestPaidAt ? localDate(new Date(report.meta.oldestPaidAt)) : "";
  const allToValue = todayText();
  const visibleFrom = rangeMode === "ALL" ? from || allFromValue : from;
  const visibleTo = rangeMode === "ALL" ? to || allToValue : to;

  useEffect(() => {
    if (rangeMode !== "ALL" || !allFromValue) return;
    if (from !== allFromValue) setFrom(allFromValue);
    if (to !== allToValue) setTo(allToValue);
  }, [allFromValue, allToValue, from, rangeMode, to]);

  function setRange(mode: RangeMode) {
    const latest = todayText();
    setRangeMode(mode);
    if (mode === "ALL") {
      setFrom("");
      setTo("");
    }
    if (mode === "TODAY") {
      setFrom(latest);
      setTo(latest);
    }
    if (mode === "7D") {
      setFrom(daysAgoText(6));
      setTo(latest);
    }
    if (mode === "MONTH") {
      setFrom(monthStartText(new Date()));
      setTo(latest);
    }
    if (mode === "YEAR") {
      setFrom(yearStartText(new Date()));
      setTo(latest);
    }
    if (mode === "CUSTOM" && !from && !to) {
      setFrom(allFromValue || latest);
      setTo(allToValue || latest);
    }
  }

  function setCustomFrom(value: string) {
    setRangeMode("CUSTOM");
    setFrom(value);
    if (!to) setTo(visibleTo || todayText());
  }

  function setCustomTo(value: string) {
    setRangeMode("CUSTOM");
    setTo(value);
    if (!from) setFrom(visibleFrom || todayText());
  }

  return (
    <div className="space-y-5 overflow-y-auto p-6">
      <ReportRangeFilter
        rangeMode={rangeMode}
        from={visibleFrom}
        to={visibleTo}
        onRange={setRange}
        onFrom={setCustomFrom}
        onTo={setCustomTo}
        onReset={() => setRange("TODAY")}
      />

      <ReportSummaryCards summary={report.summary} />

      <div className="grid gap-5 lg:grid-cols-2">
        <SalesChart report={report} rangeMode={rangeMode} />
        <section className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="font-semibold">เมนูขายดี</h2>
          <div className="mt-4 space-y-3">
            {report.topItems.map((item, index) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-50 text-xs text-blue-600">{index + 1}</span>
                <div className="flex-1"><p className="text-sm font-medium">{item.name}</p><p className="text-xs text-gray-400">{item.qty} รายการ</p></div>
                <span className="font-medium">฿{item.sales.toFixed(2)}</span>
              </div>
            ))}
            {!report.topItems.length && <p className="text-sm text-gray-400">ยังไม่มีข้อมูล</p>}
          </div>
        </section>
      </div>

      <OrdersReportTable
        rows={report.recent}
        payments={report.payments}
        onOpen={(id) => router.push(`/dashboard/reports/orders/${id}`)}
      />
    </div>
  );
}
