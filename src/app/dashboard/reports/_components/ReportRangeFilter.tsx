/**
 * ReportRangeFilter แสดงตัวเลือกสำหรับกรองข้อมูลในส่วนรายงานยอดขายและออเดอร์
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import { CalendarDays } from "lucide-react";
import type { RangeMode } from "../types";

const rangeOptions: Array<{ value: RangeMode; label: string }> = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "TODAY", label: "วันนี้" },
  { value: "7D", label: "7 วันล่าสุด" },
  { value: "MONTH", label: "เดือนนี้" },
  { value: "YEAR", label: "ปีนี้" },
  { value: "CUSTOM", label: "กำหนดเอง" },
];

type ReportRangeFilterProps = {
  rangeMode: RangeMode;
  from: string;
  to: string;
  onRange: (mode: RangeMode) => void;
  onFrom: (value: string) => void;
  onTo: (value: string) => void;
  onReset: () => void;
};

export default function ReportRangeFilter({ rangeMode, from, to, onRange, onFrom, onTo, onReset }: ReportRangeFilterProps) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
      <div>
        <h2 className="font-semibold text-gray-900">ภาพรวมยอดขาย</h2>
        <p className="mt-1 text-sm text-gray-400">เลือกช่วงวันที่เพื่อดูยอดขาย บิล และเมนูขายดี</p>
      </div>
      <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-[minmax(180px,1.2fr)_minmax(150px,1fr)_minmax(150px,1fr)_auto] lg:items-end">
        <label className="min-w-0 text-sm text-gray-500 min-[420px]:col-span-2 lg:col-span-1">
          แสดง
          <div className="relative mt-1">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select value={rangeMode} onChange={(event) => onRange(event.target.value as RangeMode)} className="block w-full min-w-0 appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-8 text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
              {rangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </label>
        <label className="min-w-0 text-sm text-gray-500">จาก<input type="date" value={from} onChange={(event) => onFrom(event.target.value)} className="mt-1 block w-full min-w-0 max-w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
        <label className="min-w-0 text-sm text-gray-500">ถึง<input type="date" value={to} onChange={(event) => onTo(event.target.value)} className="mt-1 block w-full min-w-0 max-w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
        {rangeMode === "CUSTOM" && <button type="button" onClick={onReset} className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-600 transition hover:bg-gray-50 min-[420px]:col-span-2 lg:col-span-1 lg:w-auto">รีเซ็ต</button>}
      </div>
    </section>
  );
}
