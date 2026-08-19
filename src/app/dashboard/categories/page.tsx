"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Pencil, Save, Tags, Trash2, X } from "lucide-react";

type Category = { id: number; name: string; color: string; _count: { menuItems: number } };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const load = useCallback(() => fetch("/api/categories").then((r) => r.json()).then(setCategories), []);
  useEffect(() => { load(); }, [load]);

  async function add(e: FormEvent) {
    e.preventDefault(); setError("");
    const res = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setName(""); load();
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  async function update(id: number) {
    setError("");
    setSaving(true);
    const res = await fetch("/api/categories", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: editName }) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error);
    cancelEdit();
    load();
  }

  async function remove(id: number) {
    const res = await fetch("/api/categories", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    load();
  }

  return <div className="p-6">
    <form onSubmit={add} className="bg-white rounded-2xl p-5 border border-gray-100 flex flex-col sm:flex-row gap-3">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ค้นหาหมวดหมู่" className="flex-1 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-400" />
      <button className="bg-[#356DDB] text-white rounded-xl px-6 py-3">เพิ่มหมวดหมู่</button>
    </form>
    {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
      {categories.map((category) => {
        const isEditing = editingId === category.id;
        return (
          <div key={category.id} className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
            <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Tags size={20} /></div>
            <div className="min-w-0 flex-1">
              {isEditing ? (
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") update(category.id);
                    if (event.key === "Escape") cancelEdit();
                  }}
                  autoFocus
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                />
              ) : (
                <h3 className="truncate font-medium">{category.name}</h3>
              )}
              <p className="mt-1 text-xs text-gray-400">{category._count.menuItems} เมนู</p>
            </div>
            {isEditing ? (
              <div className="flex items-center gap-1">
                <button disabled={saving} onClick={() => update(category.id)} className="rounded-lg bg-blue-50 p-2 text-blue-600 disabled:opacity-50"><Save size={17} /></button>
                <button disabled={saving} onClick={cancelEdit} className="rounded-lg bg-gray-50 p-2 text-gray-500 disabled:opacity-50"><X size={17} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <button onClick={() => startEdit(category)} className="rounded-lg p-2 text-gray-300 hover:bg-blue-50 hover:text-blue-600"><Pencil size={17} /></button>
                <button onClick={() => remove(category.id)} className="rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500"><Trash2 size={17} /></button>
              </div>
            )}
          </div>
        );
      })}
      {!categories.length && <p className="text-gray-400">ยังไม่มีหมวดหมู่</p>}
    </div>
  </div>;
}
