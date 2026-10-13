/**
 * MenuItemTable แสดงข้อมูลแบบตารางในส่วนเมนูอาหาร
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import { Pencil, Trash2 } from "lucide-react";
import type { MenuItemListItem } from "../types";

export default function MenuItemTable({
  menuItems,
  emptyMessage = "ยังไม่มีเมนูอาหาร",
  onEdit,
  onDelete,
  onToggle,
}: {
  menuItems: MenuItemListItem[];
  emptyMessage?: string;
  onEdit: (menuItem: MenuItemListItem) => void;
  onDelete: (menuItem: MenuItemListItem) => void;
  onToggle: (menuItem: MenuItemListItem) => void;
}) {
  return (
    <>
      <div className="space-y-3 xl:hidden">
        {menuItems.map((menuItem) => (
          <article key={menuItem.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm shadow-gray-100/60">
            <div className="flex items-start gap-3">
              <MenuImage menuItem={menuItem} size="mobile" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-900">{menuItem.name}</p>
                <p className="mt-0.5 truncate text-xs text-gray-400">{menuItem.sku}</p>
                <span className="mt-2 inline-flex max-w-full rounded-full bg-gray-50 px-2.5 py-1 text-xs text-gray-500">
                  <span className="truncate">{menuItem.category.name}</span>
                </span>
              </div>
              <p className="shrink-0 font-semibold text-gray-900">฿{menuItem.price.toFixed(2)}</p>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
              <Availability menuItem={menuItem} onToggle={onToggle} compact />
              <MenuActions menuItem={menuItem} onEdit={onEdit} onDelete={onDelete} />
            </div>
          </article>
        ))}
        {!menuItems.length && <EmptyState message={emptyMessage} />}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-gray-100 bg-white xl:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-4 text-left">เมนู</th>
              <th className="p-4 text-left">หมวดหมู่</th>
              <th className="p-4 text-right">ราคา</th>
              <th className="p-4 text-center">พร้อมขาย</th>
              <th className="p-4 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {menuItems.map((menuItem) => (
              <tr key={menuItem.id} className="border-t border-gray-100">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <MenuImage menuItem={menuItem} size="desktop" />
                    <div className="min-w-0">
                      <p className="font-medium">{menuItem.name}</p>
                      <p className="text-xs text-gray-400">{menuItem.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-gray-500">{menuItem.category.name}</td>
                <td className="p-4 text-right font-medium">฿{menuItem.price.toFixed(2)}</td>
                <td className="p-4 text-center"><Availability menuItem={menuItem} onToggle={onToggle} /></td>
                <td className="p-4"><MenuActions menuItem={menuItem} onEdit={onEdit} onDelete={onDelete} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!menuItems.length && <p className="py-10 text-center text-gray-400">{emptyMessage}</p>}
      </div>
    </>
  );
}

function MenuImage({ menuItem, size }: { menuItem: MenuItemListItem; size: "mobile" | "desktop" }) {
  return (
    <div className={`${size === "mobile" ? "h-14 w-14" : "h-12 w-12"} shrink-0 overflow-hidden rounded-xl bg-gray-100`}>
      {menuItem.image && <img src={menuItem.image} alt="" className="h-full w-full object-cover" />}
    </div>
  );
}

function Availability({ menuItem, onToggle, compact = false }: { menuItem: MenuItemListItem; onToggle: (menuItem: MenuItemListItem) => void; compact?: boolean }) {
  const outOfStock = menuItem.available && menuItem.stockTracked && menuItem.maxServings === 0;
  const label = !menuItem.available ? "ปิดขาย" : outOfStock ? "วัตถุดิบไม่พอ" : "พร้อมขาย";
  const tone = !menuItem.available ? "bg-gray-100 text-gray-500" : outOfStock ? "bg-red-50 text-red-600" : "bg-emerald-100 text-emerald-700";
  const detail = !menuItem.stockTracked ? "ยังไม่มีสูตร" : menuItem.maxServings === 0 ? "วัตถุดิบหมด" : `ขายได้ ${menuItem.maxServings} ${menuItem.saleUnit || "จาน"}`;
  return (
    <div className={compact ? "flex min-w-0 items-center gap-2" : ""}>
      <button type="button" onClick={() => onToggle(menuItem)} className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${tone}`}>{label}</button>
      <p className={`${compact ? "truncate" : "mt-1"} text-[11px] ${outOfStock ? "text-red-500" : "text-gray-400"}`}>{detail}</p>
    </div>
  );
}

function MenuActions({ menuItem, onEdit, onDelete }: { menuItem: MenuItemListItem; onEdit: (menuItem: MenuItemListItem) => void; onDelete: (menuItem: MenuItemListItem) => void }) {
  return (
    <div className="flex shrink-0 justify-center gap-2">
      <button type="button" aria-label={`แก้ไข ${menuItem.name}`} onClick={() => onEdit(menuItem)} className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"><Pencil size={16} /></button>
      <button type="button" aria-label={`ลบ ${menuItem.name}`} onClick={() => onDelete(menuItem)} className="rounded-lg p-2 text-gray-300 transition hover:bg-red-50 hover:text-red-500"><Trash2 size={16} /></button>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-400">{message}</div>;
}
