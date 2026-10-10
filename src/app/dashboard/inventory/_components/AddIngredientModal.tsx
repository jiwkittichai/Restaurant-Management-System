import type { FormEvent } from "react";
import { X } from "lucide-react";
import type { IngredientForm } from "../types";

type AddIngredientModalProps = {
  form: IngredientForm;
  saving: boolean;
  onForm: (form: IngredientForm) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
};

export default function AddIngredientModal({ form, saving, onForm, onClose, onSubmit }: AddIngredientModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="font-semibold text-gray-900">เพิ่มวัตถุดิบ</h2>
            <p className="mt-1 text-sm text-gray-400">กำหนดชื่อ หน่วย ยอดตั้งต้น และจุดแจ้งเตือนของวัตถุดิบ</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-gray-500">ชื่อวัตถุดิบ<input required value={form.name} onChange={(event) => onForm({ ...form, name: event.target.value })} placeholder="ชื่อวัตถุดิบ" autoFocus className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-400" /></label>
          <label className="text-sm text-gray-500">หน่วย<input required value={form.unit} onChange={(event) => onForm({ ...form, unit: event.target.value })} placeholder="หน่วย" className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-400" /></label>
          <label className="text-sm text-gray-500">ยอดตั้งต้น<input type="number" min="0" step="0.01" value={form.stock} onChange={(event) => onForm({ ...form, stock: event.target.value })} placeholder="0" className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-400" /></label>
          <label className="text-sm text-gray-500">จุดแจ้งเตือน<input type="number" min="0" step="0.01" value={form.minStock} onChange={(event) => onForm({ ...form, minStock: event.target.value })} placeholder="0" className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-400" /></label>
        </div>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-600">ยกเลิก</button>
          <button disabled={saving} className="flex-1 rounded-xl bg-[#356DDB] px-4 py-3 text-white disabled:opacity-60">บันทึก</button>
        </div>
      </form>
    </div>
  );
}
