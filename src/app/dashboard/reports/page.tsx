"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, CalendarDays, ClipboardList, Percent, ReceiptText } from "lucide-react";

type Report = {
  summary: { sales: number; discounts: number; orders: number; average: number };
  meta: { oldestPaidAt?: string | null; latestPaidAt?: string | null };
  topItems: Array<{ name: string; qty: number; sales: number }>;
  payments: Array<{ method: string; amount: number }>;
  daily: Array<{ date: string; amount: number }>;
  recent: Array<{ id: number; orderNumber: string; table: string; total: number; method: string; paidAt: string }>;
};

const empty: Report = {
  summary: { sales: 0, discounts: 0, orders: 0, average: 0 },
  meta: {},
  topItems: [],
  payments: [],
  daily: [],
  recent: [],
};

const methodText: Record<string, string> = { CASH: "เงินสด", PROMPTPAY: "พร้อมเพย์", CARD: "บัตร" };
type RangeMode = "ALL" | "TODAY" | "7D" | "MONTH" | "CUSTOM";

function localDate(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function todayText() {
  return localDate(new Date());
}

function monthStartText(date = new Date()) {
  return localDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

function daysAgoText(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return localDate(date);
}

export default function ReportsPage() {
  const [rangeMode, setRangeMode] = useState<RangeMode>("TODAY");
  const [from, setFrom] = useState(() => todayText());
  const [to, setTo] = useState(() => todayText());
  const [report, setReport] = useState<Report>(empty);

  const reportQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (rangeMode === "ALL") {
      params.set("range", "all");
    } else {
      params.set("from", from);
      params.set("to", to);
    }
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
    }

    window.addEventListener("focus", syncLatestDate);
    document.addEventListener("visibilitychange", syncLatestDate);
    return () => {
      window.removeEventListener("focus", syncLatestDate);
      document.removeEventListener("visibilitychange", syncLatestDate);
    };
  }, [rangeMode, to]);

  const cards = [
    { label: "ยอดขาย", value: `฿${report.summary.sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: Banknote, color: "text-emerald-600 bg-emerald-50" },
    { label: "จำนวนบิล", value: report.summary.orders, icon: ReceiptText, color: "text-blue-600 bg-blue-50" },
    { label: "ยอดเฉลี่ยต่อบิล", value: `฿${report.summary.average.toFixed(2)}`, icon: ClipboardList, color: "text-violet-600 bg-violet-50" },
    { label: "ส่วนลดรวม", value: `฿${report.summary.discounts.toFixed(2)}`, icon: Percent, color: "text-amber-600 bg-amber-50" },
  ];
  const max = Math.max(...report.daily.map((day) => day.amount), 1);
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
    if (mode === "CUSTOM" && !from && !to) {
      setFrom(allFromValue || latest);
      setTo(allToValue || latest);
    }
  }

  function resetToToday() {
    setRange("TODAY");
  }

  const rangeOptions: Array<{ value: RangeMode; label: string }> = [
    { value: "ALL", label: "ทั้งหมด" },
    { value: "TODAY", label: "วันนี้" },
    { value: "7D", label: "7 วันล่าสุด" },
    { value: "MONTH", label: "เดือนนี้" },
    { value: "CUSTOM", label: "กำหนดเอง" },
  ];

  return (
    <div className="p-6 space-y-5 overflow-y-auto">
      <section className="bg-white rounded-2xl border border-gray-100 p-4">
        <div>
          <h2 className="font-semibold text-gray-900">ภาพรวมยอดขาย</h2>
          <p className="mt-1 text-sm text-gray-400">เลือกช่วงวันที่เพื่อดูยอดขาย บิล และเมนูขายดี</p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="text-sm text-gray-500 sm:w-52">
            แสดง
            <div className="relative mt-1">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={rangeMode}
                onChange={(event) => setRange(event.target.value as RangeMode)}
                className="block w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-8 text-gray-800 outline-none focus:border-blue-400"
              >
                {rangeOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </label>
          <label className="text-sm text-gray-500 sm:w-44">
            จาก
            <input
              type="date"
              value={visibleFrom}
              onChange={(event) => {
                setRangeMode("CUSTOM");
                setFrom(event.target.value);
                if (!to) setTo(visibleTo || todayText());
              }}
              className="block mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-gray-800 outline-none focus:border-blue-400"
            />
          </label>
          <label className="text-sm text-gray-500 sm:w-44">
            ถึง
            <input
              type="date"
              value={visibleTo}
              onChange={(event) => {
                setRangeMode("CUSTOM");
                setTo(event.target.value);
                if (!from) setFrom(visibleFrom || todayText());
              }}
              className="block mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-gray-800 outline-none focus:border-blue-400"
            />
          </label>
          {rangeMode === "CUSTOM" && (
            <button type="button" onClick={resetToToday} className="w-fit rounded-xl border border-gray-200 px-4 py-2.5 text-gray-600">
              รีเซ็ต
            </button>
          )}
        </div>
      </section>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 flex gap-4">
            <div className={`w-11 h-11 rounded-xl grid place-items-center ${color}`}><Icon size={21} /></div>
            <div>
              <p className="text-sm text-gray-400">{label}</p>
              <p className="text-xl font-semibold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold">ยอดขายรายวัน</h2>
          <div className="h-52 flex items-end gap-2 mt-5 border-b border-gray-100">
            {report.daily.map((day) => (
              <div key={day.date} className="flex-1 min-w-8 h-full flex flex-col justify-end items-center group">
                <span className="text-[10px] text-gray-400 mb-1 opacity-0 group-hover:opacity-100">฿{day.amount.toFixed(0)}</span>
                <div className="w-full max-w-12 bg-blue-500 rounded-t-lg" style={{ height: `${Math.max(5, day.amount / max * 85)}%` }} />
                <span className="text-[10px] text-gray-400 mt-2">{day.date.slice(8)}</span>
              </div>
            ))}
            {!report.daily.length && <p className="m-auto text-gray-400 text-sm">ยังไม่มียอดขายในช่วงนี้</p>}
          </div>
        </section>
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold">เมนูขายดี</h2>
          <div className="mt-4 space-y-3">
            {report.topItems.map((item, index) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 grid place-items-center text-xs">{index + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.qty} รายการ</p>
                </div>
                <span className="font-medium">฿{item.sales.toFixed(2)}</span>
              </div>
            ))}
            {!report.topItems.length && <p className="text-gray-400 text-sm">ยังไม่มีข้อมูล</p>}
          </div>
        </section>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        <div className="p-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-semibold">ประวัติการชำระเงิน</h2>
            <p className="mt-1 text-sm text-gray-400">พบ {report.recent.length} รายการ</p>
          </div>
          <div className="flex gap-3 text-xs text-gray-500">{report.payments.map((payment) => <span key={payment.method}>{methodText[payment.method]} ฿{payment.amount.toFixed(2)}</span>)}</div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-3 text-left">เลขออเดอร์</th>
              <th className="p-3 text-left">โต๊ะ</th>
              <th className="p-3 text-left">เวลา</th>
              <th className="p-3 text-left">ช่องทาง</th>
              <th className="p-3 text-right">ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {report.recent.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className="p-3">{row.orderNumber}</td>
                <td className="p-3">{row.table}</td>
                <td className="p-3 text-gray-500">{new Date(row.paidAt).toLocaleString("th-TH")}</td>
                <td className="p-3">{methodText[row.method] || row.method}</td>
                <td className="p-3 text-right font-medium">฿{row.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!report.recent.length && <p className="text-center py-8 text-gray-400">ยังไม่มีประวัติการชำระเงิน</p>}
      </section>
    </div>
  );
}
