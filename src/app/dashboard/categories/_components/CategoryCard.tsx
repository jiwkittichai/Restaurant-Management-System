/**
 * CategoryCard แสดงข้อมูลแบบการ์ดในส่วนหมวดหมู่เมนู
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import { Pencil, Save, Tags, Trash2, X } from "lucide-react";
import type { KeyboardEvent } from "react";
import type { Category } from "../types";

type CategoryCardProps = {
  category: Category;
  editing: boolean;
  editName: string;
  saving: boolean;
  onEditName: (value: string) => void;
  onStartEdit: (category: Category) => void;
  onCancelEdit: () => void;
  onSave: (id: number) => void;
  onRemove: (id: number) => void;
};

export default function CategoryCard({ category, editing, editName, saving, onEditName, onStartEdit, onCancelEdit, onSave, onRemove }: CategoryCardProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") onSave(category.id);
    if (event.key === "Escape") onCancelEdit();
  }

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Tags size={20} /></div>
      <div className="min-w-0 flex-1">
        {editing ? (
          <input value={editName} onChange={(event) => onEditName(event.target.value)} onKeyDown={handleKeyDown} autoFocus className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
        ) : (
          <h3 className="truncate font-medium">{category.name}</h3>
        )}
        <p className="mt-1 text-xs text-gray-400">{category._count.menuItems} เมนู</p>
      </div>
      {editing ? (
        <div className="flex items-center gap-1">
          <button disabled={saving} onClick={() => onSave(category.id)} className="rounded-lg bg-blue-50 p-2 text-blue-600 disabled:opacity-50"><Save size={17} /></button>
          <button disabled={saving} onClick={onCancelEdit} className="rounded-lg bg-gray-50 p-2 text-gray-500 disabled:opacity-50"><X size={17} /></button>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <button onClick={() => onStartEdit(category)} className="rounded-lg p-2 text-gray-300 hover:bg-blue-50 hover:text-blue-600"><Pencil size={17} /></button>
          <button onClick={() => onRemove(category.id)} className="rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500"><Trash2 size={17} /></button>
        </div>
      )}
    </div>
  );
}
