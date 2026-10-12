import { Pencil, Plus, Search } from "lucide-react";
import type { TableTab } from "../types";
import TableFilterCard from "./TableFilterCard";

type Tab = { key: TableTab; label: string; value: string; tone: string; activeClass: string; hoverClass: string };

type TablesHeaderProps = {
  search: string;
  tabs: Tab[];
  activeTab: TableTab;
  canManage: boolean;
  managementMode: boolean;
  onSearch: (value: string) => void;
  onTab: (value: TableTab) => void;
  onAdd: () => void;
  onToggleManagement: () => void;
};

export default function TablesHeader({ search, tabs, activeTab, canManage, managementMode, onSearch, onTab, onAdd, onToggleManagement }: TablesHeaderProps) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-gray-900">ภาพรวมโต๊ะอาหาร</h2>
          <p className="mt-0.5 text-sm text-gray-400">ดูสถานะโต๊ะ ออเดอร์ในครัว และยอดบิลได้จากหน้านี้</p>
        </div>
        {canManage && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              title={managementMode ? "ปิดโหมดแก้ไข" : "แก้ไขโต๊ะ"}
              aria-label={managementMode ? "ปิดโหมดแก้ไขโต๊ะ" : "เปิดโหมดแก้ไขโต๊ะ"}
              aria-pressed={managementMode}
              onClick={onToggleManagement}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition ${managementMode ? "border-blue-600 bg-blue-50 text-blue-600" : "border-gray-200 bg-white text-gray-500 hover:border-blue-200 hover:text-blue-600"}`}
            >
              <Pencil size={17} />
            </button>
            <button type="button" title="เพิ่มโต๊ะ" aria-label="เพิ่มโต๊ะ" onClick={onAdd} className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#356DDB] text-white shadow-sm transition hover:bg-blue-700">
              <Plus size={18} />
            </button>
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-2 xl:flex-row">
        <div className="relative xl:min-w-[260px] xl:flex-[1.35]">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="ค้นหาโต๊ะ เลขออเดอร์ หรือสถานะ" className="h-full min-h-[58px] w-full rounded-xl border border-gray-100 bg-white pl-11 pr-4 text-sm font-medium text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex-[4]">
          {tabs.map((tab) => <TableFilterCard key={tab.key} active={activeTab === tab.key} label={tab.label} value={tab.value} tone={tab.tone} activeClass={tab.activeClass} hoverClass={tab.hoverClass} onClick={() => onTab(tab.key)} />)}
        </div>
      </div>
    </section>
  );
}
