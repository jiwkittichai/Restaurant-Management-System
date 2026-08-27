"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Banknote, CalendarDays, ClipboardList, Percent, ReceiptText, X } from "lucide-react";

type Report = {
  summary: { sales: number; discounts: number; orders: number; average: number };
  meta: { oldestPaidAt?: string | null; latestPaidAt?: string | null };
  topItems: Array<{ name: string; qty: number; sales: number }>;
  payments: Array<{ method: string; amount: number }>;
  daily: Array<{ date: string; amount: number; orders?: number; average?: number }>;
  chart?: Array<{ key?: string; label: string; amount: number; orders: number; average: number }>;
  chartMode?: "hour" | "day" | "month" | "year";
  recent: ReportOrder[];
};

type ReportOrder = {
  id: number;
  orderNumber: string;
  table: string;
  type: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  note?: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  method: string;
  paidAt: string;
  receivedAmount?: number | null;
  changeAmount?: number | null;
  items: Array<{
    id: number;
    name: string;
    qty: number;
    price: number;
    saleUnit: string;
    note?: string | null;
    status: string;
    modifiers?: Array<{ id: number; name: string; price: number }>;
  }>;
};

const empty: Report = {
  summary: { sales: 0, discounts: 0, orders: 0, average: 0 },
  meta: {},
  topItems: [],
  payments: [],
  daily: [],
  chart: [],
  recent: [],
};

const methodText: Record<string, string> = { CASH: "เงินสด", PROMPTPAY: "พร้อมเพย์", CARD: "บัตร" };
const orderTypeText: Record<string, string> = { DINE_IN: "ทานที่ร้าน", TAKEAWAY: "ซื้อกลับบ้าน" };
type RangeMode = "ALL" | "TODAY" | "7D" | "MONTH" | "YEAR" | "CUSTOM";

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

function yearStartText(date = new Date()) {
  return localDate(new Date(date.getFullYear(), 0, 1));
}

function daysAgoText(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return localDate(date);
}

function money(value: number) {
  return `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function compactMoney(value: number) {
  if (value >= 1000000) return `฿${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `฿${(value / 1000).toFixed(1)}k`;
  return `฿${value.toLocaleString("th-TH")}`;
}

function shortDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });
}

export default function ReportsPage() {
  const [rangeMode, setRangeMode] = useState<RangeMode>("TODAY");
  const [from, setFrom] = useState(() => todayText());
  const [to, setTo] = useState(() => todayText());
  const [report, setReport] = useState<Report>(empty);
  const [selectedOrder, setSelectedOrder] = useState<ReportOrder | null>(null);

  const reportQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (rangeMode === "ALL") {
      params.set("range", "all");
    } else {
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

  const cards = [
    { label: "ยอดขาย", value: money(report.summary.sales), icon: Banknote, color: "text-emerald-600 bg-emerald-50" },
    { label: "จำนวนบิล", value: report.summary.orders, icon: ReceiptText, color: "text-blue-600 bg-blue-50" },
    { label: "ยอดเฉลี่ยต่อบิล", value: money(report.summary.average), icon: ClipboardList, color: "text-violet-600 bg-violet-50" },
    { label: "ส่วนลดรวม", value: money(report.summary.discounts), icon: Percent, color: "text-amber-600 bg-amber-50" },
  ];
  const chartData = report.chart?.length
    ? report.chart
    : report.daily.map((day) => ({
      key: day.date,
      label: day.date.slice(8),
      amount: day.amount,
      orders: day.orders || 0,
      average: day.average || 0,
    }));
  const maxAmount = Math.max(...chartData.map((item) => item.amount), 1);
  const max = Math.max(100, Math.ceil((maxAmount * 1.25) / 100) * 100);
  const bestPoint = chartData.reduce<(typeof chartData)[number] | null>(
    (best, item) => (!best || item.amount > best.amount ? item : best),
    null,
  );
  const chartMode = report.chartMode || (rangeMode === "TODAY" ? "hour" : rangeMode === "YEAR" || rangeMode === "ALL" ? "month" : "day");
  const chartTitle = chartMode === "hour"
    ? "ยอดขายรายชั่วโมง"
    : chartMode === "year"
      ? "ยอดขายรายปี"
      : chartMode === "month"
        ? "ยอดขายรายเดือน"
        : "ยอดขายรายวัน";
  const chartXAxisLabel = chartMode === "hour"
    ? "เวลา"
    : chartMode === "year"
      ? "ปี"
      : chartMode === "month"
        ? "เดือน"
        : "วันที่";
  const chartWidth = Math.max(720, chartData.length * (chartMode === "hour" ? 58 : chartMode === "day" ? 64 : 82));
  const chartHeight = 300;
  const chartMargin = { top: 32, right: 18, bottom: 54, left: 72 };
  const plotWidth = chartWidth - chartMargin.left - chartMargin.right;
  const plotHeight = chartHeight - chartMargin.top - chartMargin.bottom;
  const yAxisRows = [1, 0.75, 0.5, 0.25, 0].map((ratio) => {
    const value = Math.round(max * ratio);
    return {
      value,
      y: chartMargin.top + (1 - ratio) * plotHeight,
    };
  });
  const barSlot = chartData.length ? plotWidth / chartData.length : plotWidth;
  const barWidth = Math.min(48, Math.max(18, barSlot * 0.52));
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

  function resetToToday() {
    setRange("TODAY");
  }

  const rangeOptions: Array<{ value: RangeMode; label: string }> = [
    { value: "ALL", label: "ทั้งหมด" },
    { value: "TODAY", label: "วันนี้" },
    { value: "7D", label: "7 วันล่าสุด" },
    { value: "MONTH", label: "เดือนนี้" },
    { value: "YEAR", label: "ปีนี้" },
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold">{chartTitle}</h2>
              <p className="mt-1 text-sm text-gray-400">กราฟแท่งจะเปลี่ยนหน่วยตามช่วงวันที่ที่เลือก</p>
            </div>
            {bestPoint && (
              <div className="rounded-xl bg-blue-50 px-3 py-2 text-right">
                <p className="text-xs text-blue-500">สูงสุด</p>
                <p className="font-semibold text-blue-700">{money(bestPoint.amount)}</p>
              </div>
            )}
          </div>
          <div className="mt-5">
            {!!chartData.length && (
              <div>
                <div className="overflow-x-auto">
                  <svg
                    role="img"
                    aria-label={chartTitle}
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="block h-[300px] max-w-none"
                    style={{ width: chartWidth }}
                  >
                    <text x={0} y={14} className="fill-gray-400 text-[11px] font-medium">ยอดขาย (บาท)</text>
                    {yAxisRows.map(({ value, y }) => (
                      <g key={value}>
                        <line
                          x1={chartMargin.left}
                          x2={chartWidth - chartMargin.right}
                          y1={y}
                          y2={y}
                          stroke="#eef2f7"
                          strokeDasharray={value === 0 ? undefined : "4 4"}
                        />
                        <text
                          x={chartMargin.left - 12}
                          y={y + 4}
                          textAnchor="end"
                          className="fill-gray-400 text-[10px] font-medium"
                        >
                          {compactMoney(value)}
                        </text>
                      </g>
                    ))}
                    <line
                      x1={chartMargin.left}
                      x2={chartMargin.left}
                      y1={chartMargin.top}
                      y2={chartMargin.top + plotHeight}
                      stroke="#eef2f7"
                    />
                    {chartData.map((item, index) => {
                      const x = chartMargin.left + index * barSlot + barSlot / 2;
                      const barHeight = item.amount > 0 ? Math.max(8, (item.amount / max) * plotHeight) : 0;
                      const y = chartMargin.top + plotHeight - barHeight;
                      return (
                        <g key={item.key || `${item.label}-${index}`}>
                          {item.amount > 0 && (
                            <>
                              <rect
                                x={x - barWidth / 2}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                rx={8}
                                className="fill-blue-500"
                              />
                              <text
                                x={x}
                                y={Math.max(14, y - 8)}
                                textAnchor="middle"
                                className="fill-gray-700 text-[11px] font-semibold"
                              >
                                {money(item.amount)}
                              </text>
                            </>
                          )}
                          {item.amount === 0 && (
                            <rect
                              x={x - barWidth / 2}
                              y={chartMargin.top + plotHeight - 8}
                              width={barWidth}
                              height={8}
                              rx={8}
                              className="fill-blue-100"
                            />
                          )}
                          <text
                            x={x}
                            y={chartMargin.top + plotHeight + 22}
                            textAnchor="middle"
                            className="fill-gray-400 text-[10px] font-medium"
                          >
                            {item.label}
                          </text>
                          <title>{`${item.label} ${money(item.amount)} · ${item.orders} บิล`}</title>
                        </g>
                      );
                    })}
                    <text
                      x={chartMargin.left + plotWidth / 2}
                      y={chartHeight - 10}
                      textAnchor="middle"
                      className="fill-gray-400 text-[12px] font-medium"
                    >
                      {chartXAxisLabel}
                    </text>
                  </svg>
                </div>
              </div>
            )}
            {!chartData.length && <p className="py-12 text-center text-sm text-gray-400">ยังไม่มียอดขายในช่วงนี้</p>}
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
              <tr
                key={row.id}
                tabIndex={0}
                role="button"
                aria-label={`ดูรายละเอียด ${row.orderNumber}`}
                className={`cursor-pointer border-t border-gray-100 transition focus:outline-none ${
                  selectedOrder?.id === row.id
                    ? "bg-gray-100"
                    : "hover:bg-gray-50 focus:bg-gray-50"
                }`}
                onClick={() => setSelectedOrder(row)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedOrder(row);
                  }
                }}
              >
                <td className="p-3 font-medium text-gray-900">{row.orderNumber}</td>
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

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
          <button
            type="button"
            aria-label="ปิดรายละเอียดบิล"
            className="hidden flex-1 cursor-default sm:block"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="h-full w-full overflow-y-auto bg-white p-5 shadow-2xl sm:max-w-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ReceiptText size={22} />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">รายละเอียดบิลออเดอร์</h2>
                  <p className="text-sm text-gray-400">{selectedOrder.orderNumber} · {selectedOrder.table}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-400">ประเภทออเดอร์</p>
                <p className="mt-1 font-medium">{orderTypeText[selectedOrder.type] || selectedOrder.type}</p>
              </div>
              <div className="rounded-xl border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-400">ช่องทางชำระเงิน</p>
                <p className="mt-1 font-medium">{methodText[selectedOrder.method] || selectedOrder.method}</p>
              </div>
              <div className="rounded-xl border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-400">เวลาชำระเงิน</p>
                <p className="mt-1 font-medium">{new Date(selectedOrder.paidAt).toLocaleString("th-TH")}</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-400">หมายเหตุ</p>
              <p className="mt-1 font-medium text-gray-900">{selectedOrder.note || "-"}</p>
            </div>

            {(selectedOrder.customerName || selectedOrder.customerPhone) && (
              <div className="mt-3 rounded-xl border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-400">ข้อมูลลูกค้า</p>
                {selectedOrder.customerName && <p className="mt-1 font-medium">{selectedOrder.customerName}</p>}
                {selectedOrder.customerPhone && <p className="text-sm text-gray-500">{selectedOrder.customerPhone}</p>}
              </div>
            )}

            <div className="mt-5">
              <h3 className="font-semibold text-gray-900">รายการอาหาร</h3>
              <div className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-100">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">
                          <span className="mr-2 text-blue-600">{item.qty}x</span>{item.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">{money(item.price)} / {item.saleUnit || "หน่วย"}</p>
                        {!!item.modifiers?.length && (
                          <p className="mt-1 text-xs text-blue-600">
                            {item.modifiers.map((modifier) => `+ ${modifier.name}${modifier.price ? ` ${money(modifier.price)}` : ""}`).join(", ")}
                          </p>
                        )}
                        {item.note && <p className="mt-1 text-xs text-red-500">หมายเหตุ: {item.note}</p>}
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-medium">{money(item.price * item.qty)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 -mx-5 mt-6 border-t border-gray-100 bg-white p-5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-500"><span>ยอดอาหาร</span><span>{money(selectedOrder.subtotal)}</span></div>
                <div className="flex justify-between text-gray-500"><span>ส่วนลด</span><span>{money(selectedOrder.discount)}</span></div>
                {selectedOrder.receivedAmount != null && (
                  <div className="flex justify-between text-gray-500"><span>รับเงิน</span><span>{money(selectedOrder.receivedAmount)}</span></div>
                )}
                {selectedOrder.changeAmount != null && (
                  <div className="flex justify-between text-gray-500"><span>เงินทอน</span><span>{money(selectedOrder.changeAmount)}</span></div>
                )}
                <div className="flex justify-between border-t border-gray-100 pt-3 text-base font-semibold text-gray-900">
                  <span>รวมสุทธิ</span>
                  <span className="text-blue-600">{money(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
