/**
 * SalesChart แสดงข้อมูลของรายงานยอดขายและออเดอร์ในรูปแบบกราฟ
 * ใช้รับข้อมูลจากส่วนอื่นและจัดการการโต้ตอบที่จำเป็นบนหน้าจอ
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RangeMode, Report } from "../types";
import { compactMoney, money } from "../utils";

function axisMaximum(value: number) {
  if (!(value > 0)) return 100;
  const roughStep = (value * 1.2) / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalizedStep = roughStep / magnitude;
  const niceStep = [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10].find((candidate) => candidate >= normalizedStep) || 10;
  return niceStep * magnitude * 4;
}

export function chartAxisRows(maximum: number) {
  const step = maximum / 4;
  return [4, 3, 2, 1, 0].map((multiplier) => ({
    value: step * multiplier,
    ratio: multiplier / 4,
  }));
}

export default function SalesChart({ report, rangeMode }: { report: Report; rangeMode: RangeMode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const data = useMemo(() => report.chart?.length
    ? report.chart
    : report.daily.map((day) => ({
        key: day.date,
        label: day.date.slice(8),
        amount: day.amount,
        orders: day.orders || 0,
        average: day.average || 0,
      })), [report.chart, report.daily]);
  // Use the real maximum. Falling back to 1 made an empty chart use a 1.2-baht
  // ceiling; rounding its ticks then produced duplicate React keys (1, 1, 1, 0, 0).
  const maxAmount = Math.max(...data.map((item) => item.amount), 0);
  const max = axisMaximum(maxAmount);
  const best = data.reduce<(typeof data)[number] | null>(
    (current, item) => (!current || item.amount > current.amount ? item : current),
    null,
  );
  const mode = report.chartMode || (rangeMode === "TODAY" ? "hour" : rangeMode === "YEAR" || rangeMode === "ALL" ? "month" : "day");
  const title = mode === "hour" ? "ยอดขายรายชั่วโมง" : mode === "year" ? "ยอดขายรายปี" : mode === "month" ? "ยอดขายรายเดือน" : "ยอดขายรายวัน";
  const axisLabel = mode === "hour" ? "เวลา" : mode === "year" ? "ปี" : mode === "month" ? "เดือน" : "วันที่";
  const compact = viewportWidth > 0 && viewportWidth < 640;
  const height = compact ? 320 : 400;
  const margin = { top: 36, right: compact ? 12 : 18, bottom: 56, left: compact ? 58 : 72 };
  const pointWidth = compact
    ? mode === "hour" ? 54 : mode === "day" ? 70 : mode === "month" ? 76 : 84
    : mode === "hour" ? 36 : mode === "day" ? 64 : mode === "month" ? 68 : 78;
  const minimumWidth = margin.left + margin.right + Math.max(data.length, 1) * pointWidth;
  const width = Math.max(viewportWidth || 720, minimumWidth);
  const shouldScroll = viewportWidth > 0 && width > viewportWidth + 1;
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const rows = chartAxisRows(max).map(({ value, ratio }) => ({
    value,
    y: margin.top + (1 - ratio) * plotHeight,
  }));
  const slot = data.length ? plotWidth / data.length : plotWidth;
  const barWidth = Math.min(compact ? 42 : 52, Math.max(20, slot * 0.56));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function updateWidth() {
      setViewportWidth(Math.max(0, Math.floor(container?.getBoundingClientRect().width || 0)));
    }

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const viewport = scrollRef.current;
    if (!viewport || mode !== "hour" || !shouldScroll) return;
    const lastSaleIndex = data.reduce((lastIndex, item, index) => item.amount > 0 ? index : lastIndex, -1);
    if (lastSaleIndex < 0) return;
    const saleCenter = margin.left + lastSaleIndex * slot + slot / 2;
    viewport.scrollLeft = Math.max(0, saleCenter - viewport.clientWidth * 0.7);
  }, [data, margin.left, mode, shouldScroll, slot]);

  return (
    <section className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-gray-400">กราฟแท่งจะเปลี่ยนหน่วยตามช่วงวันที่ที่เลือก</p>
        </div>
        {best && best.amount > 0 && (
          <div className="w-fit shrink-0 rounded-xl bg-blue-50 px-3 py-2 sm:text-right">
            <p className="text-xs text-blue-500">สูงสุด</p>
            <p className="font-semibold text-blue-700">{money(best.amount)}</p>
          </div>
        )}
      </div>

      <div ref={containerRef} className="mt-4 flex min-h-[320px] min-w-0 flex-1 flex-col sm:mt-5 sm:min-h-[300px]">
        {data.length ? (
          <>
            {shouldScroll && <p className="mb-2 text-right text-xs text-gray-400">เลื่อนซ้าย–ขวาเพื่อดูข้อมูลทั้งหมด</p>}
            <div ref={scrollRef} className="min-h-0 max-w-full flex-1 overflow-x-auto overflow-y-hidden overscroll-x-contain pb-2" tabIndex={shouldScroll ? 0 : undefined} aria-label={shouldScroll ? "เลื่อนกราฟซ้ายขวาเพื่อดูข้อมูลทั้งหมด" : undefined}>
              <svg
                role="img"
                aria-label={title}
                viewBox={`0 0 ${width} ${height}`}
                className="block max-w-none"
                style={{ width, height }}
              >
                <text x={0} y={14} className="fill-gray-400 text-[11px] font-medium">ยอดขาย (บาท)</text>
                {rows.map(({ value, y }, index) => (
                  <g key={`axis-${index}`}>
                    <line x1={margin.left} x2={width - margin.right} y1={y} y2={y} stroke="#eef2f7" strokeDasharray={value === 0 ? undefined : "4 4"} />
                    <text x={margin.left - 10} y={y + 4} textAnchor="end" className="fill-gray-400 text-[10px] font-medium">{compactMoney(value)}</text>
                  </g>
                ))}
                <line x1={margin.left} x2={margin.left} y1={margin.top} y2={margin.top + plotHeight} stroke="#eef2f7" />
                {data.map((item, index) => {
                  const x = margin.left + index * slot + slot / 2;
                  const barHeight = item.amount > 0 ? Math.max(8, (item.amount / max) * plotHeight) : 0;
                  const y = margin.top + plotHeight - barHeight;

                  return (
                    <g key={item.key || `${item.label}-${index}`}>
                      {item.amount > 0 ? (
                        <>
                          <rect x={x - barWidth / 2} y={y} width={barWidth} height={barHeight} rx={8} className="fill-blue-500" />
                          <text x={x} y={Math.max(18, y - 8)} textAnchor="middle" className="fill-gray-700 text-[11px] font-semibold">{money(item.amount)}</text>
                        </>
                      ) : (
                        <rect x={x - barWidth / 2} y={margin.top + plotHeight - 8} width={barWidth} height={8} rx={8} className="fill-blue-100" />
                      )}
                      <text x={x} y={margin.top + plotHeight + 22} textAnchor="middle" className="fill-gray-400 text-[10px] font-medium">{item.label}</text>
                      <title>{`${item.label} ${money(item.amount)} · ${item.orders} บิล`}</title>
                    </g>
                  );
                })}
                <text x={margin.left + plotWidth / 2} y={height - 10} textAnchor="middle" className="fill-gray-400 text-[12px] font-medium">{axisLabel}</text>
              </svg>
            </div>
          </>
        ) : (
          <p className="py-12 text-center text-sm text-gray-400">ยังไม่มียอดขายในช่วงนี้</p>
        )}
      </div>
    </section>
  );
}
