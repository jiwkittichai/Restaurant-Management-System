import type { RangeMode, Report } from "../types";
import { compactMoney, money } from "../utils";

export default function SalesChart({ report, rangeMode }: { report: Report; rangeMode: RangeMode }) {
  const data = report.chart?.length ? report.chart : report.daily.map(day => ({ key: day.date, label: day.date.slice(8), amount: day.amount, orders: day.orders || 0, average: day.average || 0 }));
  const maxAmount = Math.max(...data.map(item => item.amount), 1);
  const max = Math.max(100, Math.ceil((maxAmount * 1.25) / 100) * 100);
  const best = data.reduce<(typeof data)[number] | null>((current, item) => (!current || item.amount > current.amount ? item : current), null);
  const mode = report.chartMode || (rangeMode === "TODAY" ? "hour" : rangeMode === "YEAR" || rangeMode === "ALL" ? "month" : "day");
  const title = mode === "hour" ? "ยอดขายรายชั่วโมง" : mode === "year" ? "ยอดขายรายปี" : mode === "month" ? "ยอดขายรายเดือน" : "ยอดขายรายวัน";
  const axisLabel = mode === "hour" ? "เวลา" : mode === "year" ? "ปี" : mode === "month" ? "เดือน" : "วันที่";
  const width = Math.max(720, data.length * (mode === "hour" ? 58 : mode === "day" ? 64 : 82));
  const height = 300;
  const margin = { top: 32, right: 18, bottom: 54, left: 72 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const rows = [1, 0.75, 0.5, 0.25, 0].map(ratio => ({ value: Math.round(max * ratio), y: margin.top + (1 - ratio) * plotHeight }));
  const slot = data.length ? plotWidth / data.length : plotWidth;
  const barWidth = Math.min(48, Math.max(18, slot * 0.52));

  return <section className="rounded-2xl border border-gray-100 bg-white p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm text-gray-400">กราฟแท่งจะเปลี่ยนหน่วยตามช่วงวันที่ที่เลือก</p></div>{best && <div className="rounded-xl bg-blue-50 px-3 py-2 text-right"><p className="text-xs text-blue-500">สูงสุด</p><p className="font-semibold text-blue-700">{money(best.amount)}</p></div>}</div><div className="mt-5">{!!data.length ? <div className="overflow-x-auto"><svg role="img" aria-label={title} viewBox={`0 0 ${width} ${height}`} className="block h-[300px] max-w-none" style={{ width }}><text x={0} y={14} className="fill-gray-400 text-[11px] font-medium">ยอดขาย (บาท)</text>{rows.map(({ value, y }) => <g key={value}><line x1={margin.left} x2={width - margin.right} y1={y} y2={y} stroke="#eef2f7" strokeDasharray={value === 0 ? undefined : "4 4"} /><text x={margin.left - 12} y={y + 4} textAnchor="end" className="fill-gray-400 text-[10px] font-medium">{compactMoney(value)}</text></g>)}<line x1={margin.left} x2={margin.left} y1={margin.top} y2={margin.top + plotHeight} stroke="#eef2f7" />{data.map((item, index) => { const x = margin.left + index * slot + slot / 2; const barHeight = item.amount > 0 ? Math.max(8, (item.amount / max) * plotHeight) : 0; const y = margin.top + plotHeight - barHeight; return <g key={item.key || `${item.label}-${index}`}>{item.amount > 0 ? <><rect x={x - barWidth / 2} y={y} width={barWidth} height={barHeight} rx={8} className="fill-blue-500" /><text x={x} y={Math.max(14, y - 8)} textAnchor="middle" className="fill-gray-700 text-[11px] font-semibold">{money(item.amount)}</text></> : <rect x={x - barWidth / 2} y={margin.top + plotHeight - 8} width={barWidth} height={8} rx={8} className="fill-blue-100" />}<text x={x} y={margin.top + plotHeight + 22} textAnchor="middle" className="fill-gray-400 text-[10px] font-medium">{item.label}</text><title>{`${item.label} ${money(item.amount)} · ${item.orders} บิล`}</title></g>; })}<text x={margin.left + plotWidth / 2} y={height - 10} textAnchor="middle" className="fill-gray-400 text-[12px] font-medium">{axisLabel}</text></svg></div> : <p className="py-12 text-center text-sm text-gray-400">ยังไม่มียอดขายในช่วงนี้</p>}</div></section>;
}
