import { Pencil, Trash2 } from "lucide-react";
import type { MenuItemListItem } from "../types";

export default function MenuItemTable({
  menuItems,
  onEdit,
  onDelete,
  onToggle,
}: {
  menuItems: MenuItemListItem[];
  onEdit: (menuItem: MenuItemListItem) => void;
  onDelete: (menuItem: MenuItemListItem) => void;
  onToggle: (menuItem: MenuItemListItem) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
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
                  <div className="h-12 w-12 overflow-hidden rounded-xl bg-gray-100">
                    {menuItem.image && (
                      <img
                        src={menuItem.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{menuItem.name}</p>
                    <p className="text-xs text-gray-400">{menuItem.sku}</p>
                  </div>
                </div>
              </td>
              <td className="p-4 text-gray-500">{menuItem.category.name}</td>
              <td className="p-4 text-right font-medium">
                ฿{menuItem.price.toFixed(2)}
              </td>
              <td className="p-4 text-center">
                <button
                  onClick={() => onToggle(menuItem)}
                  className={`rounded-full px-3 py-1 text-xs ${menuItem.available ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {menuItem.available ? "พร้อมขาย" : "ปิดขาย"}
                </button>
                <p
                  className={`mt-1 text-[11px] ${menuItem.maxServings === 0 ? "text-red-500" : "text-gray-400"}`}
                >
                  {!menuItem.stockTracked
                    ? "ยังไม่มีสูตร"
                    : menuItem.maxServings === 0
                      ? "วัตถุดิบหมด"
                      : `ขายได้ ${menuItem.maxServings} ${menuItem.saleUnit || "จาน"}`}
                </p>
              </td>
              <td className="p-4">
                <div className="flex justify-center gap-2">
                  <button
                    aria-label={`แก้ไข ${menuItem.name}`}
                    onClick={() => onEdit(menuItem)}
                    className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    aria-label={`ลบ ${menuItem.name}`}
                    onClick={() => onDelete(menuItem)}
                    className="rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!menuItems.length && (
        <p className="py-10 text-center text-gray-400">ยังไม่มีเมนูอาหาร</p>
      )}
    </div>
  );
}
