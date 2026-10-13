/**
 * AddCategoryModal แสดงหน้าต่างสำหรับทำรายการในส่วนหมวดหมู่เมนู
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import { X } from "lucide-react";
import type { FormEvent } from "react";

type AddCategoryModalProps = {
  name: string;
  saving: boolean;
  onName: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
};

export default function AddCategoryModal({ name, saving, onName, onClose, onSubmit }: AddCategoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
          <div><h2 className="font-semibold text-gray-900">เพิ่มหมวดหมู่</h2><p className="mt-1 text-sm text-gray-400">สร้างหมวดหมู่ใหม่สำหรับจัดกลุ่มเมนูอาหาร</p></div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700"><X size={20} /></button>
        </div>
        <label className="mt-5 block text-sm text-gray-500">ชื่อหมวดหมู่<input value={name} onChange={(event) => onName(event.target.value)} autoFocus placeholder="เช่น อาหารจานเดียว" className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-400" /></label>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-600">ยกเลิก</button>
          <button disabled={saving} className="flex-1 rounded-xl bg-[#356DDB] px-4 py-3 text-white disabled:opacity-60">บันทึก</button>
        </div>
      </form>
    </div>
  );
}
