/**
 * InventoryHeader แสดงหัวข้อและคำสั่งหลักของวัตถุดิบและสต็อก
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import { AlertTriangle, CheckCircle2, PackageOpen, Plus, Search } from "lucide-react";
import type { StockFilter } from "../types";
import StockFilterCard from "./StockFilterCard";

type InventoryHeaderProps = {
  search: string;
  activeFilter: StockFilter;
  totalCount: number;
  lowStockCount: number;
  onSearch: (value: string) => void;
  onFilter: (filter: StockFilter) => void;
  onAdd: () => void;
};

export default function InventoryHeader({
  search,
  activeFilter,
  totalCount,
  lowStockCount,
  onSearch,
  onFilter,
  onAdd,
}: InventoryHeaderProps) {
  const stockCards = [
    { key: "ALL" as const, label: "ทั้งหมด", value: `${totalCount} รายการ`, tone: "text-gray-900", icon: PackageOpen, iconClass: "bg-blue-50 text-blue-600", activeClass: "border-blue-300 bg-blue-50 shadow-sm", hoverClass: "hover:border-blue-200 hover:bg-blue-50/40" },
    { key: "LOW" as const, label: "ใกล้หมด", value: `${lowStockCount} รายการ`, tone: "text-amber-600", icon: AlertTriangle, iconClass: "bg-amber-50 text-amber-600", activeClass: "border-amber-300 bg-amber-50 shadow-sm", hoverClass: "hover:border-amber-200 hover:bg-amber-50/50" },
    { key: "READY" as const, label: "พร้อมใช้", value: `${Math.max(0, totalCount - lowStockCount)} รายการ`, tone: "text-emerald-600", icon: CheckCircle2, iconClass: "bg-emerald-50 text-emerald-600", activeClass: "border-emerald-300 bg-emerald-50 shadow-sm", hoverClass: "hover:border-emerald-200 hover:bg-emerald-50/40" },
  ];

  return (
    <section className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900">ภาพรวมสต็อก</h2>
          <p className="mt-0.5 text-sm text-gray-400">ภาพรวมวัตถุดิบและรายการที่ต้องตรวจสอบ</p>
        </div>
        <button
          type="button"
          title="เพิ่มวัตถุดิบ"
          aria-label="เพิ่มวัตถุดิบ"
          onClick={onAdd}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#356DDB] text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-2 xl:flex-row">
        <div className="relative xl:min-w-[260px] xl:flex-[1.35]">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="ค้นหาวัตถุดิบ"
            className="h-full min-h-[58px] w-full rounded-xl border border-gray-100 bg-white pl-11 pr-4 text-sm font-medium text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex-[3]">
          {stockCards.map((card) => (
            <StockFilterCard
              key={card.key}
              active={activeFilter === card.key}
              label={card.label}
              value={card.value}
              tone={card.tone}
              icon={card.icon}
              iconClass={card.iconClass}
              activeClass={card.activeClass}
              hoverClass={card.hoverClass}
              onClick={() => onFilter(card.key)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
