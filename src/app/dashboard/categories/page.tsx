"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Tags, Trash2 } from "lucide-react";

type Category = { id: number; name: string; color: string; _count: { menuItems: number } };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(() => fetch("/api/categories").then((r) => r.json()).then(setCategories), []);
  useEffect(() => { load(); }, [load]);

  async function add(e: FormEvent) {
    e.preventDefault(); setError("");
    const res = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    setName(""); load();
  }

  async function remove(id: number) {
    const res = await fetch("/api/categories", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await res.json();
    if (!res.ok) return setError(data.error);
    load();
  }

  return <div className="p-6">
    <form onSubmit={add} className="bg-white rounded-2xl p-5 border border-gray-100 flex flex-col sm:flex-row gap-3">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อหมวดหมู่ เช่น อาหารจานเดียว" className="flex-1 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-400" />
      <button className="bg-[#356DDB] text-white rounded-xl px-6 py-3">เพิ่มหมวดหมู่</button>
    </form>
    {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
      {categories.map((category) => <div key={category.id} className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
        <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Tags size={20} /></div>
        <div className="flex-1"><h3 className="font-medium">{category.name}</h3><p className="text-xs text-gray-400">{category._count.menuItems} เมนู</p></div>
        <button onClick={() => remove(category.id)} className="text-gray-300 hover:text-red-500"><Trash2 size={18} /></button>
      </div>)}
      {!categories.length && <p className="text-gray-400">ยังไม่มีหมวดหมู่</p>}
    </div>
  </div>;
}
