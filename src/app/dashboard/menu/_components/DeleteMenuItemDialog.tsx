/**
 * DeleteMenuItemDialog แสดงกล่องยืนยันก่อนทำรายการในส่วนเมนูอาหาร
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import type { MenuItemListItem } from "../types";

export default function DeleteMenuItemDialog({
  menuItem,
  onClose,
  onConfirm,
}: {
  menuItem: MenuItemListItem;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <h2 className="font-semibold text-gray-900">ลบเมนูอาหาร</h2>
        <p className="mt-2 text-sm text-gray-500">
          ต้องการลบ {menuItem.name} หรือไม่?
          หากเมนูนี้มีประวัติออเดอร์หรือข้อมูลที่เกี่ยวข้อง ระบบจะไม่อนุญาตให้ลบ
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-600"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-white"
          >
            ลบเมนู
          </button>
        </div>
      </div>
    </div>
  );
}
