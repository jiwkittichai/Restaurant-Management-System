import { AlertTriangle, PackageOpen, Pencil, Save, Trash2, X } from "lucide-react";
import type { EditForm, Ingredient } from "../types";

type IngredientCardProps = {
  item: Ingredient;
  editForm: EditForm | null;
  receiveQuantity: string;
  saving: boolean;
  onStartEdit: (item: Ingredient) => void;
  onCancelEdit: () => void;
  onEditForm: (form: EditForm) => void;
  onSave: (id: number) => void;
  onDelete: (item: Ingredient) => void;
  onReceiveQuantity: (value: string) => void;
  onStockIn: (id: number) => void;
};

export default function IngredientCard({
  item,
  editForm,
  receiveQuantity,
  saving,
  onStartEdit,
  onCancelEdit,
  onEditForm,
  onSave,
  onDelete,
  onReceiveQuantity,
  onStockIn,
}: IngredientCardProps) {
  const low = item.stock <= item.minStock;
  const isEditing = editForm !== null;

  return (
    <div id={`ingredient-${item.id}`} className={`rounded-2xl border bg-white p-5 ${low ? "border-amber-300" : "border-gray-100"}`}>
      <div className="flex items-start justify-between">
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${low ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
          {low ? <AlertTriangle size={21} /> : <PackageOpen size={21} />}
        </div>
        {isEditing ? (
          <div className="flex gap-1">
            <button type="button" disabled={saving} onClick={() => onSave(item.id)} className="rounded-lg bg-blue-50 p-2 text-blue-600 disabled:opacity-50"><Save size={17} /></button>
            <button type="button" disabled={saving} onClick={onCancelEdit} className="rounded-lg bg-gray-50 p-2 text-gray-500 disabled:opacity-50"><X size={17} /></button>
          </div>
        ) : (
          <div className="flex gap-1">
            <button type="button" onClick={() => onStartEdit(item)} className="rounded-lg p-2 text-gray-300 hover:bg-blue-50 hover:text-blue-600"><Pencil size={17} /></button>
            <button type="button" onClick={() => onDelete(item)} className="rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500"><Trash2 size={17} /></button>
          </div>
        )}
      </div>

      {editForm ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="col-span-2 text-xs font-medium text-gray-500">ชื่อวัตถุดิบ<input value={editForm.name} onChange={(event) => onEditForm({ ...editForm, name: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-blue-400" /></label>
          <label className="text-xs font-medium text-gray-500">คงเหลือ<input type="number" min="0" step="0.01" value={editForm.stock} onChange={(event) => onEditForm({ ...editForm, stock: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-blue-400" /></label>
          <label className="text-xs font-medium text-gray-500">หน่วย<input value={editForm.unit} onChange={(event) => onEditForm({ ...editForm, unit: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-blue-400" /></label>
          <label className="col-span-2 text-xs font-medium text-gray-500">จุดแจ้งเตือน<input type="number" min="0" step="0.01" value={editForm.minStock} onChange={(event) => onEditForm({ ...editForm, minStock: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-blue-400" /></label>
        </div>
      ) : (
        <>
          <h3 className="mt-3 font-semibold">{item.name}</h3>
          <div className="mt-1 flex items-end gap-1">
            <span className={`text-2xl font-semibold ${low ? "text-amber-600" : "text-gray-800"}`}>{item.stock.toLocaleString()}</span>
            <span className="mb-1 text-sm text-gray-400">{item.unit}</span>
          </div>
          <p className="text-xs text-gray-400">แจ้งเตือนเมื่อ ≤ {item.minStock} · ใช้ใน {item._count.recipes + item._count.modifierRecipes} สูตร</p>
          <div className="mt-4 flex gap-2">
            <input type="number" min="0" step="0.01" value={receiveQuantity} onChange={(event) => onReceiveQuantity(event.target.value)} placeholder="จำนวนรับเข้า" className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm" />
            <button type="button" onClick={() => onStockIn(item.id)} className="rounded-lg bg-emerald-600 px-3 text-sm text-white">รับเข้า</button>
          </div>
        </>
      )}
    </div>
  );
}
