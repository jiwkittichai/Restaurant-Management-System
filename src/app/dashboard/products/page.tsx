"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Menu = { id: number; name: string; sku: string; description?: string; price: number; saleUnit:string; image?: string; available: boolean; stockTracked: boolean; maxServings: number|null; sellable:boolean; category: { name: string } };

export default function MenuPage() {
  const router = useRouter();
  const [items, setItems] = useState<Menu[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(() => fetch("/api/menu").then((r) => r.json()).then(setItems), []);
  useEffect(() => { load(); }, [load]);

  async function toggle(item: Menu) {
    await fetch("/api/menu", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, available: !item.available }) }); load();
  }
  async function remove(id: number) {
    if (!confirm("ลบเมนูนี้ใช่หรือไม่?")) return;
    const res = await fetch("/api/menu", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await res.json(); if (!res.ok) setError(data.error); else load();
  }
  const filtered = items.filter((i) => `${i.name} ${i.sku} ${i.category.name}`.toLowerCase().includes(search.toLowerCase()));

  return <div className="p-6">
    <div className="flex flex-col sm:flex-row justify-between gap-3 mb-5">
      <div className="relative max-w-md flex-1"><Search className="absolute left-3 top-3.5 text-gray-400" size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ค้นหาเมนู" className="w-full bg-white rounded-xl py-3 pl-10 pr-4 outline-none border border-gray-100" /></div>
      <button onClick={() => router.push("/dashboard/products/create")} className="bg-[#356DDB] text-white rounded-xl px-5 py-3 flex items-center justify-center gap-2"><Plus size={18} /> เพิ่มเมนู</button>
    </div>
    {error && <p className="text-red-500 mb-3">{error}</p>}
    <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
      <table className="w-full text-sm"><thead className="bg-gray-50 text-gray-500"><tr><th className="p-4 text-left">เมนู</th><th className="p-4 text-left">หมวดหมู่</th><th className="p-4 text-right">ราคา</th><th className="p-4 text-center">พร้อมขาย</th><th className="p-4 text-center">จัดการ</th></tr></thead>
      <tbody>{filtered.map((item) => <tr key={item.id} className="border-t border-gray-100">
        <td className="p-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden">{item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}</div><div><p className="font-medium">{item.name}</p><p className="text-xs text-gray-400">{item.sku}</p></div></div></td>
        <td className="p-4 text-gray-500">{item.category.name}</td><td className="p-4 text-right font-medium">฿{item.price.toFixed(2)}</td>
        <td className="p-4 text-center"><button onClick={() => toggle(item)} className={`px-3 py-1 rounded-full text-xs ${item.available ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{item.available ? "พร้อมขาย" : "ปิดขาย"}</button><p className={`text-[11px] mt-1 ${item.maxServings===0?"text-red-500":"text-gray-400"}`}>{!item.stockTracked?"ยังไม่มีสูตร":item.maxServings===0?"วัตถุดิบหมด":`ขายได้ ${item.maxServings} ${item.saleUnit||"จาน"}`}</p></td>
        <td className="p-4"><div className="flex justify-center gap-2"><button aria-label={`แก้ไข ${item.name}`} onClick={() => router.push(`/dashboard/products/${item.id}/edit`)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><Pencil size={16} /></button><button aria-label={`ลบ ${item.name}`} onClick={() => remove(item.id)} className="p-2 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500"><Trash2 size={16} /></button></div></td>
      </tr>)}</tbody></table>
      {!filtered.length && <p className="text-center py-10 text-gray-400">ยังไม่มีเมนูอาหาร</p>}
    </div>
  </div>;
}
