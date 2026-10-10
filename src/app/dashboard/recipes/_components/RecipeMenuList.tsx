import { BookOpenText, Search } from "lucide-react";
import type { Menu } from "../types";

type RecipeMenuListProps = {
  menu: Menu[];
  selectedMenuId: string;
  search: string;
  onSearch: (value: string) => void;
  onSelect: (menu: Menu) => void;
};

export default function RecipeMenuList({ menu, selectedMenuId, search, onSearch, onSelect }: RecipeMenuListProps) {
  return (
    <aside className="flex min-h-0 flex-col rounded-2xl border border-gray-100 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><BookOpenText size={20} /></div>
        <div className="min-w-0"><h2 className="font-semibold text-gray-900">สูตรอาหาร</h2><p className="mt-0.5 text-sm text-gray-400">เลือกเมนูเพื่อกำหนดวัตถุดิบต่อ 1 รายการ</p></div>
      </div>
      <div className="relative mt-4">
        <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="ค้นหาเมนูอาหาร" className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50" />
      </div>
      <div className="mt-4 min-h-0 space-y-2 overflow-y-auto pr-1">
        {menu.map((item) => {
          const active = selectedMenuId === String(item.id);
          const ingredientCount = item.recipes.filter((recipe) => recipe.quantity > 0).length;
          return (
            <button key={item.id} type="button" onClick={() => onSelect(item)} className={`w-full rounded-xl border p-3 text-left transition ${active ? "border-blue-300 bg-blue-50" : "border-gray-100 hover:border-blue-100 hover:bg-blue-50/40"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate font-medium text-gray-900">{item.name}</p><p className="mt-1 truncate text-xs text-gray-400">{item.category.name} · {item.saleUnit || "รายการ"}</p></div>
                <span title="จำนวนวัตถุดิบในเมนูหลัก ไม่รวมตัวเลือกเสริม" className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${ingredientCount ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  {ingredientCount ? `วัตถุดิบ ${ingredientCount} รายการ` : "ยังไม่กำหนดวัตถุดิบ"}
                </span>
              </div>
            </button>
          );
        })}
        {!menu.length && <p className="py-10 text-center text-sm text-gray-400">ไม่พบเมนูอาหาร</p>}
      </div>
    </aside>
  );
}
