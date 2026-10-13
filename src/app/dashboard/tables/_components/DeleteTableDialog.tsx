/**
 * DeleteTableDialog แสดงกล่องยืนยันก่อนทำรายการในส่วนโต๊ะและออเดอร์ภายในร้าน
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import { AlertTriangle, Trash2, X } from "lucide-react";
import type { RestaurantTable } from "../types";

type DeleteTableDialogProps = {
  table: RestaurantTable;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteTableDialog({ table, deleting, onClose, onConfirm }: DeleteTableDialogProps) {
  const inUse = Boolean(table.orders[0] || table.sessions?.length);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-4">
      <div role="alertdialog" aria-modal="true" aria-labelledby="delete-table-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500"><AlertTriangle size={21} /></div>
            <div>
              <h2 id="delete-table-title" className="font-semibold text-gray-900">ลบ {table.name}?</h2>
              <p className="mt-1 text-sm text-gray-500">
                {inUse ? "โต๊ะนี้กำลังมีออเดอร์หรือ QR เปิดใช้งานอยู่ ต้องปิดการใช้งานก่อนจึงจะลบได้" : "โต๊ะจะถูกนำออกจากหน้าร้าน แต่ประวัติออเดอร์เดิมจะยังคงอยู่"}
              </p>
            </div>
          </div>
          <button type="button" disabled={deleting} onClick={onClose} aria-label="ปิด" className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 disabled:opacity-50"><X size={20} /></button>
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" disabled={deleting} onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-600 disabled:opacity-50">ยกเลิก</button>
          <button type="button" disabled={deleting || inUse} onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-white disabled:cursor-not-allowed disabled:opacity-40">
            <span className="inline-flex items-center justify-center gap-2"><Trash2 size={17} />{deleting ? "กำลังลบ..." : "ลบโต๊ะ"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
