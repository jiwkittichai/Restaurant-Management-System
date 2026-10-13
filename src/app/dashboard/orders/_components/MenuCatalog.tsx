/**
 * MenuCatalog แสดงรายการที่เลือกได้ในส่วนการรับออเดอร์
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import { Search, ShoppingBag } from "lucide-react";
import type { Category, MenuItem } from "../types";
import { saleUnit } from "../utils";

type Props = {
  menu: MenuItem[];
  categories: Category[];
  category: number | "all";
  search: string;
  onSearch: (value: string) => void;
  onCategory: (value: number | "all") => void;
  onAdd: (item: MenuItem) => void;
};

export default function MenuCatalog({
  menu,
  categories,
  category,
  search,
  onSearch,
  onCategory,
  onAdd,
}: Props) {
  const filtered = menu.filter(
    (item) =>
      (category === "all" || item.category.id === category) &&
      item.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <section>
      <div className="relative mb-4">
        <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="ค้นหาเมนูอาหาร"
          className="w-full rounded-xl bg-white py-3 pl-11 pr-4 outline-none"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-4">
        <button
          onClick={() => onCategory("all")}
          className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${category === "all" ? "bg-[#356DDB] text-white" : "bg-white text-gray-500"}`}
        >
          ทั้งหมด
        </button>
        {categories.map((item) => (
          <button
            key={item.id}
            onClick={() => onCategory(item.id)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${category === item.id ? "bg-[#356DDB] text-white" : "bg-white text-gray-500"}`}
          >
            {item.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-4">
        {filtered.map((item) => (
          <button
            key={item.id}
            disabled={!item.sellable}
            onClick={() => onAdd(item)}
            className={`relative rounded-2xl border bg-white p-3 text-left transition ${item.sellable ? "border-gray-100 hover:shadow-md" : "cursor-not-allowed border-red-100 opacity-60"}`}
          >
            <span
              className={`absolute right-5 top-5 z-10 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm ${!item.available || item.maxServings === 0 ? "bg-red-500 text-white" : item.stockTracked && item.maxServings !== null && item.maxServings <= 5 ? "bg-amber-400 text-amber-950" : "bg-white/90 text-gray-500"}`}
            >
              {!item.available
                ? "ปิดขาย"
                : item.maxServings === 0
                  ? "หมด"
                  : item.stockTracked
                    ? `เหลือ ${item.maxServings} ${saleUnit(item)}`
                    : "ไม่ติดตามสต็อก"}
            </span>
            <div className="mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <div className="grid h-full w-full place-items-center text-gray-300">
                  <ShoppingBag />
                </div>
              )}
            </div>
            <p className="truncate font-medium">{item.name}</p>
            <div className="mt-1 flex justify-between">
              <span className="text-xs text-gray-400">
                {item.category.name}
              </span>
              <span className="font-semibold text-blue-600">
                ฿{item.price.toFixed(2)}
              </span>
            </div>
          </button>
        ))}
      </div>
      {!filtered.length && (
        <p className="mt-16 text-center text-gray-400">
          {category === "all"
            ? "ยังไม่มีเมนูพร้อมขาย"
            : "ยังไม่มีเมนูในหมวดนี้"}
        </p>
      )}
    </section>
  );
}
