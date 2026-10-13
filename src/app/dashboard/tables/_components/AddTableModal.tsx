/**
 * AddTableModal แสดงหน้าต่างสำหรับทำรายการในส่วนโต๊ะและออเดอร์ภายในร้าน
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import type { FormEvent } from "react";
import { Armchair, Plus, Save, X } from "lucide-react";

type AddTableModalProps = {
  name: string;
  seats: string;
  editing: boolean;
  saving: boolean;
  onName: (value: string) => void;
  onSeats: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
};

export default function AddTableModal({ name, seats, editing, saving, onName, onSeats, onClose, onSubmit }: AddTableModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Armchair size={22} /></div>
            <div>
              <h2 className="font-semibold text-gray-900">{editing ? "แก้ไขโต๊ะอาหาร" : "เพิ่มโต๊ะอาหาร"}</h2>
              <p className="mt-1 text-sm text-gray-400">กำหนดชื่อโต๊ะและจำนวนที่นั่งสำหรับหน้าร้าน</p>
            </div>
          </div>
          <button type="button" disabled={saving} onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50"><X size={20} /></button>
        </div>
        <div className="mt-5 space-y-4">
          <label className="block"><span className="text-sm font-medium text-gray-700">ชื่อโต๊ะ</span><input required autoFocus maxLength={50} value={name} onChange={(event) => onName(event.target.value)} placeholder="เช่น A1, โต๊ะ 1" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
          <label className="block"><span className="text-sm font-medium text-gray-700">จำนวนที่นั่ง</span><input required type="number" min="1" max="100" value={seats} onChange={(event) => onSeats(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></label>
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" disabled={saving} onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-600 disabled:opacity-50">ยกเลิก</button>
          <button disabled={saving} className="flex-1 rounded-xl bg-[#356DDB] px-4 py-3 text-white disabled:opacity-60">
            <span className="inline-flex items-center justify-center gap-2">
              {editing ? <Save size={17} /> : <Plus size={17} />}
              {saving ? "กำลังบันทึก..." : editing ? "บันทึก" : "เพิ่มโต๊ะ"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
