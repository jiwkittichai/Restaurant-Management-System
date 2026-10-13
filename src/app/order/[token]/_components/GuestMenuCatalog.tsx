/**
 * GuestMenuCatalog แสดงรายการที่เลือกได้ในส่วนการสั่งอาหารผ่าน QR
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import { Plus, Search, Utensils } from "lucide-react";
import type { GuestMenuItem } from "../types";
import { guestMoney } from "../utils";

type Props = {
  menu: GuestMenuItem[];
  category: number;
  search: string;
  blocked: boolean;
  onCategory: (categoryId: number) => void;
  onSearch: (value: string) => void;
  onSelect: (menu: GuestMenuItem) => void;
};

export default function GuestMenuCatalog({
  menu,
  category,
  search,
  blocked,
  onCategory,
  onSearch,
  onSelect,
}: Props) {
  const categories = [
    ...new Map(menu.map((item) => [item.category.id, item.category])).values(),
  ];
  const filteredMenu = menu.filter(
    (item) =>
      (!category || item.category.id === category) &&
      item.name.includes(search),
  );

  return (
    <>
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
        <input
          aria-label="ค้นหาอาหาร"
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="วันนี้อยากทานอะไร?"
          className="w-full rounded-2xl border border-slate-200 bg-white p-3 pl-12 outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[{ id: 0, name: "ทั้งหมด" }, ...categories].map((item) => (
          <button
            key={item.id}
            onClick={() => onCategory(item.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm ${
              category === item.id
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white"
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {filteredMenu.map((item) => (
          <button
            disabled={blocked || !item.available}
            key={item.id}
            onClick={() => onSelect(item)}
            className="overflow-hidden rounded-2xl border border-slate-100 bg-white text-left disabled:opacity-50"
          >
            <div className="flex aspect-[4/3] items-center justify-center bg-slate-100">
              {item.image ? (
                <img
                  src={item.image}
                  referrerPolicy="no-referrer"
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Utensils size={32} className="text-slate-300" />
              )}
            </div>
            <div className="p-3">
              <p className="mb-1 text-xs text-slate-400">
                {item.category.name}
              </p>
              <h2 className="font-medium">{item.name}</h2>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-semibold text-blue-700">
                  {guestMoney(item.price)}
                </span>
                {item.available ? (
                  <Plus size={22} className="rounded-full bg-blue-50 p-1" />
                ) : (
                  <span className="text-xs text-red-600">หมดชั่วคราว</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {!filteredMenu.length && (
        <p className="py-12 text-center text-slate-500">ไม่พบเมนูอาหาร</p>
      )}
    </>
  );
}
