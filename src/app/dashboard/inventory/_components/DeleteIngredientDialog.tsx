import type { Ingredient } from "../types";

export default function DeleteIngredientDialog({ ingredient, onClose, onConfirm }: { ingredient: Ingredient; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <h2 className="font-semibold text-gray-900">ลบวัตถุดิบ</h2>
        <p className="mt-2 text-sm text-gray-500">
          ต้องการลบ {ingredient.name} หรือไม่? หากวัตถุดิบนี้ถูกใช้ในสูตรอาหาร ระบบจะไม่อนุญาตให้ลบ
        </p>
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-600">ยกเลิก</button>
          <button type="button" onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-white">ลบวัตถุดิบ</button>
        </div>
      </div>
    </div>
  );
}
