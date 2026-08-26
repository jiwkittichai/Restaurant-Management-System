"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, PackageOpen, Pencil, Plus, Save, Trash2, X } from "lucide-react";

type Movement = { id: number; type: string; quantity: number; note?: string; createdAt: string };
type Ingredient = { id: number; name: string; unit: string; stock: number; minStock: number; _count: { recipes: number; modifierRecipes: number }; movements: Movement[] };
type Recipe = { ingredientId: number; quantity: number; ingredient: Ingredient };
type ModifierOption = { id: number; name: string; price: number; recipes: Recipe[] };
type ModifierGroup = { id: number; name: string; required: boolean; minSelect: number; maxSelect: number; options: ModifierOption[] };
type Menu = { id: number; name: string; saleUnit: string; category: { name: string }; recipes: Recipe[]; modifierGroups: ModifierGroup[] };
type EditForm = { name: string; unit: string; stock: string; minStock: string };
type RecipeTarget = { type: "menu"; id: number; label: string; recipes: Recipe[] } | { type: "modifier"; id: number; label: string; groupName: string; recipes: Recipe[] };

export default function InventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menu, setMenu] = useState<Menu[]>([]);
  const [form, setForm] = useState({ name: "", unit: "กรัม", stock: "", minStock: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [receive, setReceive] = useState<Record<number, string>>({});
  const [selectedMenu, setSelectedMenu] = useState("");
  const [targetKey, setTargetKey] = useState("");
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");

  const load = useCallback(
    () => Promise.all([fetch("/api/inventory").then((r) => r.json()), fetch("/api/recipes").then((r) => r.json())]).then(([i, m]) => {
      setIngredients(i);
      setMenu(m);
    }),
    [],
  );

  useEffect(() => { load(); }, [load]);

  const selected = useMemo(() => menu.find((item) => item.id === Number(selectedMenu)), [menu, selectedMenu]);
  const recipeTargets = useMemo<RecipeTarget[]>(() => {
    if (!selected) return [];
    return [
      { type: "menu", id: selected.id, label: `สูตรเมนูหลัก`, recipes: selected.recipes },
      ...selected.modifierGroups.flatMap((group) => group.options.map((option) => ({
        type: "modifier" as const,
        id: option.id,
        label: option.name,
        groupName: group.name,
        recipes: option.recipes,
      }))),
    ];
  }, [selected]);
  const selectedTarget = recipeTargets.find((target) => `${target.type}:${target.id}` === targetKey) || recipeTargets[0];

  useEffect(() => {
    if (!selected) {
      setTargetKey("");
      return;
    }
    setTargetKey(`menu:${selected.id}`);
  }, [selected?.id]);

  useEffect(() => {
    const next: Record<number, string> = {};
    selectedTarget?.recipes.forEach((recipe) => {
      next[recipe.ingredientId] = String(recipe.quantity);
    });
    setQuantities(next);
  }, [selectedTarget?.type, selectedTarget?.id]);

  async function add(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error);
    setForm({ name: "", unit: "กรัม", stock: "", minStock: "" });
    setMessage("เพิ่มวัตถุดิบแล้ว");
    load();
  }

  async function stockIn(id: number) {
    const quantity = Number(receive[id]);
    if (!(quantity > 0)) return;
    const response = await fetch("/api/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "stock-in", id, quantity }) });
    if (response.ok) {
      setReceive({ ...receive, [id]: "" });
      setMessage("รับวัตถุดิบเข้าสต็อกแล้ว");
      load();
    }
  }

  function startEdit(item: Ingredient) {
    setEditingId(item.id);
    setEditForm({ name: item.name, unit: item.unit, stock: String(item.stock), minStock: String(item.minStock) });
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function updateIngredient(id: number) {
    if (!editForm) return;
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...editForm }) });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(data.error || "แก้ไขวัตถุดิบไม่สำเร็จ");
    cancelEdit();
    setMessage("แก้ไขวัตถุดิบแล้ว");
    load();
  }

  async function remove(id: number) {
    if (!confirm("ลบวัตถุดิบนี้ใช่หรือไม่?")) return;
    const response = await fetch("/api/inventory", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await response.json();
    if (!response.ok) setMessage(data.error);
    else load();
  }

  async function saveRecipe() {
    if (!selectedTarget) return;
    const list = Object.entries(quantities)
      .filter(([, quantity]) => Number(quantity) > 0)
      .map(([ingredientId, quantity]) => ({ ingredientId: Number(ingredientId), quantity: Number(quantity) }));
    const response = await fetch("/api/recipes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: selectedTarget.type,
        menuItemId: selectedTarget.type === "menu" ? selectedTarget.id : undefined,
        modifierId: selectedTarget.type === "modifier" ? selectedTarget.id : undefined,
        ingredients: list,
      }),
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error);
    setMessage("บันทึกสูตรอาหารแล้ว");
    load();
  }

  return (
    <div className="space-y-6 overflow-y-auto p-6">
      <form onSubmit={add} className="rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="mb-4 font-semibold">เพิ่มวัตถุดิบ</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="ชื่อวัตถุดิบ" className="rounded-xl border px-3 py-2.5" />
          <input required value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="หน่วย เช่น กรัม" className="rounded-xl border px-3 py-2.5" />
          <input type="number" min="0" step="0.01" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} placeholder="ยอดตั้งต้น" className="rounded-xl border px-3 py-2.5" />
          <input type="number" min="0" step="0.01" value={form.minStock} onChange={(event) => setForm({ ...form, minStock: event.target.value })} placeholder="จุดแจ้งเตือน" className="rounded-xl border px-3 py-2.5" />
          <button className="flex items-center justify-center gap-2 rounded-xl bg-[#356DDB] px-4 py-2.5 text-white"><Plus size={17} /> เพิ่ม</button>
        </div>
      </form>

      {message && <p className={`text-sm ${message.includes("แล้ว") ? "text-emerald-600" : "text-red-500"}`}>{message}</p>}

      <section>
        <div className="mb-3 flex justify-between">
          <h2 className="font-semibold">คงเหลือในสต็อก</h2>
          <span className="text-sm text-gray-400">{ingredients.filter((item) => item.stock <= item.minStock).length} รายการใกล้หมด</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ingredients.map((item) => {
            const low = item.stock <= item.minStock;
            const isEditing = editingId === item.id;
            return (
              <div key={item.id} className={`rounded-2xl border bg-white p-5 ${low ? "border-amber-300" : "border-gray-100"}`}>
                <div className="flex items-start justify-between">
                  <div className={`grid h-11 w-11 place-items-center rounded-xl ${low ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}>
                    {low ? <AlertTriangle size={21} /> : <PackageOpen size={21} />}
                  </div>
                  {isEditing ? (
                    <div className="flex gap-1">
                      <button type="button" disabled={saving} onClick={() => updateIngredient(item.id)} className="rounded-lg bg-blue-50 p-2 text-blue-600 disabled:opacity-50"><Save size={17} /></button>
                      <button type="button" disabled={saving} onClick={cancelEdit} className="rounded-lg bg-gray-50 p-2 text-gray-500 disabled:opacity-50"><X size={17} /></button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button type="button" onClick={() => startEdit(item)} className="rounded-lg p-2 text-gray-300 hover:bg-blue-50 hover:text-blue-600"><Pencil size={17} /></button>
                      <button type="button" onClick={() => remove(item.id)} className="rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500"><Trash2 size={17} /></button>
                    </div>
                  )}
                </div>
                {isEditing && editForm ? (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <label className="col-span-2 text-xs font-medium text-gray-500">ชื่อวัตถุดิบ<input value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-blue-400" /></label>
                    <label className="text-xs font-medium text-gray-500">คงเหลือ<input type="number" min="0" step="0.01" value={editForm.stock} onChange={(event) => setEditForm({ ...editForm, stock: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-blue-400" /></label>
                    <label className="text-xs font-medium text-gray-500">หน่วย<input value={editForm.unit} onChange={(event) => setEditForm({ ...editForm, unit: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-blue-400" /></label>
                    <label className="col-span-2 text-xs font-medium text-gray-500">จุดแจ้งเตือน<input type="number" min="0" step="0.01" value={editForm.minStock} onChange={(event) => setEditForm({ ...editForm, minStock: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal text-gray-900 outline-none focus:border-blue-400" /></label>
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
                      <input type="number" min="0" step="0.01" value={receive[item.id] || ""} onChange={(event) => setReceive({ ...receive, [item.id]: event.target.value })} placeholder="จำนวนรับเข้า" className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm" />
                      <button type="button" onClick={() => stockIn(item.id)} className="rounded-lg bg-emerald-600 px-3 text-sm text-white">รับเข้า</button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="font-semibold">กำหนดสูตรอาหาร</h2>
        <p className="mt-1 text-sm text-gray-400">เลือกเมนูหลักหรือสูตรของตัวเลือก เพื่อกำหนดวัตถุดิบที่ใช้ต่อ 1 รายการ</p>
        <select value={selectedMenu} onChange={(event) => setSelectedMenu(event.target.value)} className="mt-4 w-full rounded-xl border bg-white px-4 py-3 sm:max-w-md">
          <option value="">เลือกเมนูอาหาร</option>
          {menu.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.category.name}</option>)}
        </select>

        {selected && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {recipeTargets.map((target) => {
                const key = `${target.type}:${target.id}`;
                const active = key === targetKey;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTargetKey(key)}
                    className={`rounded-xl border px-3 py-2 text-sm ${active ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-100 bg-gray-50 text-gray-600"}`}
                  >
                    {target.type === "menu" ? target.label : `${target.groupName}: ${target.label}`}
                  </button>
                );
              })}
            </div>
            {selected.modifierGroups.length === 0 && <p className="text-sm text-gray-400">เมนูนี้ยังไม่มีตัวเลือก จึงมีเฉพาะสูตรเมนูหลัก</p>}
          </div>
        )}

        {selectedTarget && (
          <>
            <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">{selectedTarget.type === "menu" ? selected?.name : selectedTarget.label}</p>
              <p className="mt-1 text-xs text-gray-400">
                {selectedTarget.type === "menu" ? `สูตรเมนูหลักต่อ 1 ${selected?.saleUnit || "รายการ"}` : `สูตรตัวเลือกในกลุ่ม ${selectedTarget.groupName} ต่อ 1 รายการ`}
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ingredients.map((ingredient) => (
                <label key={ingredient.id} className="rounded-xl border border-gray-100 p-3">
                  <span className="text-sm font-medium">{ingredient.name}</span>
                  <div className="mt-2 flex items-center gap-2">
                    <input type="number" min="0" step="0.01" value={quantities[ingredient.id] || ""} onChange={(event) => setQuantities({ ...quantities, [ingredient.id]: event.target.value })} placeholder="0" className="w-full rounded-lg bg-gray-50 px-3 py-2" />
                    <span className="text-xs text-gray-400">{ingredient.unit}</span>
                  </div>
                </label>
              ))}
            </div>
            <button type="button" onClick={saveRecipe} className="mt-4 flex items-center gap-2 rounded-xl bg-[#212A3A] px-5 py-2.5 text-white"><Save size={17} /> บันทึกสูตร</button>
          </>
        )}
      </section>
    </div>
  );
}
