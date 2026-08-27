"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, PackageOpen, Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";

type Movement = { id: number; type: string; quantity: number; note?: string; createdAt: string };
type Ingredient = { id: number; name: string; unit: string; stock: number; minStock: number; _count: { recipes: number; modifierRecipes: number }; movements: Movement[] };
type Recipe = { ingredientId: number; quantity: number; ingredient: Ingredient };
type ModifierOption = { id: number; name: string; price: number; recipes: Recipe[] };
type ModifierGroup = { id: number; name: string; required: boolean; minSelect: number; maxSelect: number; options: ModifierOption[] };
type Menu = { id: number; name: string; saleUnit: string; category: { name: string }; recipes: Recipe[]; modifierGroups: ModifierGroup[] };
type EditForm = { name: string; unit: string; stock: string; minStock: string };
type RecipeTarget = { type: "menu"; id: number; label: string; recipes: Recipe[] } | { type: "modifier"; id: number; label: string; groupName: string; recipes: Recipe[] };
type StockFilter = "ALL" | "LOW" | "READY";

export default function InventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menu, setMenu] = useState<Menu[]>([]);
  const [form, setForm] = useState({ name: "", unit: "กรัม", stock: "", minStock: "" });
  const [addingIngredient, setAddingIngredient] = useState(false);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("ALL");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<Ingredient | null>(null);
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
    setSaving(true);
    const response = await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(data.error);
    setForm({ name: "", unit: "กรัม", stock: "", minStock: "" });
    setAddingIngredient(false);
    setMessage("เพิ่มวัตถุดิบแล้ว");
    load();
  }

  function closeAdd() {
    setAddingIngredient(false);
    setForm({ name: "", unit: "กรัม", stock: "", minStock: "" });
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
    const response = await fetch("/api/inventory", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await response.json();
    if (!response.ok) setMessage(data.error);
    else {
      setConfirmingDelete(null);
      load();
    }
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

  const lowStockCount = ingredients.filter((item) => item.stock <= item.minStock).length;
  const stockCards = [
    { key: "ALL" as const, label: "ทั้งหมด", value: `${ingredients.length} รายการ`, tone: "text-gray-900", icon: PackageOpen, iconClass: "bg-blue-50 text-blue-600", activeClass: "border-blue-300 bg-blue-50 shadow-sm", hoverClass: "hover:border-blue-200 hover:bg-blue-50/40" },
    { key: "LOW" as const, label: "ใกล้หมด", value: `${lowStockCount} รายการ`, tone: "text-amber-600", icon: AlertTriangle, iconClass: "bg-amber-50 text-amber-600", activeClass: "border-amber-300 bg-amber-50 shadow-sm", hoverClass: "hover:border-amber-200 hover:bg-amber-50/50" },
    { key: "READY" as const, label: "พร้อมใช้", value: `${Math.max(0, ingredients.length - lowStockCount)} รายการ`, tone: "text-emerald-600", icon: CheckCircle2, iconClass: "bg-emerald-50 text-emerald-600", activeClass: "border-emerald-300 bg-emerald-50 shadow-sm", hoverClass: "hover:border-emerald-200 hover:bg-emerald-50/40" },
  ];
  const filteredIngredients = ingredients.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.trim().toLowerCase());
    const low = item.stock <= item.minStock;
    if (stockFilter === "LOW") return matchesSearch && low;
    if (stockFilter === "READY") return matchesSearch && !low;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 overflow-y-auto p-4 sm:p-6">
      <section className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900">ภาพรวมสต็อก</h2>
            <p className="mt-0.5 text-sm text-gray-400">ภาพรวมวัตถุดิบและรายการที่ต้องตรวจสอบ</p>
          </div>
          <button
            type="button"
            title="เพิ่มวัตถุดิบ"
            aria-label="เพิ่มวัตถุดิบ"
            onClick={() => {
              setAddingIngredient(true);
              setMessage("");
            }}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#356DDB] text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-2 xl:flex-row">
          <div className="relative xl:min-w-[260px] xl:flex-[1.35]">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหาวัตถุดิบ"
              className="h-full min-h-[58px] w-full rounded-xl border border-gray-100 bg-white pl-11 pr-4 text-sm font-medium text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex-[3]">
            {stockCards.map((card) => (
              <StockFilterCard
                key={card.key}
                active={stockFilter === card.key}
                label={card.label}
                value={card.value}
                tone={card.tone}
                icon={card.icon}
                iconClass={card.iconClass}
                activeClass={card.activeClass}
                hoverClass={card.hoverClass}
                onClick={() => setStockFilter(card.key)}
              />
            ))}
          </div>
        </div>
      </section>

      {message && <p className={`text-sm ${message.includes("แล้ว") ? "text-emerald-600" : "text-red-500"}`}>{message}</p>}

      <section>
        <div className="mb-3">
          <div>
            <h2 className="font-semibold">คงเหลือในสต็อก</h2>
            <p className="mt-1 text-sm text-gray-400">ค้นหา กรอง และรับวัตถุดิบเข้าสต็อกจากรายการนี้</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredIngredients.map((item) => {
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
                      <button type="button" onClick={() => setConfirmingDelete(item)} className="rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500"><Trash2 size={17} /></button>
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
          {!filteredIngredients.length && <p className="text-sm text-gray-400">ไม่พบวัตถุดิบตามเงื่อนไขที่เลือก</p>}
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

      {addingIngredient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <form onSubmit={add} className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="font-semibold text-gray-900">เพิ่มวัตถุดิบ</h2>
                <p className="mt-1 text-sm text-gray-400">กำหนดชื่อ หน่วย ยอดตั้งต้น และจุดแจ้งเตือนของวัตถุดิบ</p>
              </div>
              <button type="button" onClick={closeAdd} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-gray-500">
                ชื่อวัตถุดิบ
                <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="เช่น หมูสับ" autoFocus className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-400" />
              </label>
              <label className="text-sm text-gray-500">
                หน่วย
                <input required value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} placeholder="เช่น กรัม ขวด กระป๋อง" className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-400" />
              </label>
              <label className="text-sm text-gray-500">
                ยอดตั้งต้น
                <input type="number" min="0" step="0.01" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} placeholder="0" className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-400" />
              </label>
              <label className="text-sm text-gray-500">
                จุดแจ้งเตือน
                <input type="number" min="0" step="0.01" value={form.minStock} onChange={(event) => setForm({ ...form, minStock: event.target.value })} placeholder="0" className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-400" />
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={closeAdd} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-600">
                ยกเลิก
              </button>
              <button disabled={saving} className="flex-1 rounded-xl bg-[#356DDB] px-4 py-3 text-white disabled:opacity-60">
                บันทึก
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmingDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="font-semibold text-gray-900">ลบวัตถุดิบ</h2>
            <p className="mt-2 text-sm text-gray-500">
              ต้องการลบ {confirmingDelete.name} หรือไม่? หากวัตถุดิบนี้ถูกใช้ในสูตรอาหาร ระบบจะไม่อนุญาตให้ลบ
            </p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setConfirmingDelete(null)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-600">ยกเลิก</button>
              <button type="button" onClick={() => remove(confirmingDelete.id)} className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-white">ลบวัตถุดิบ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StockFilterCard({
  active,
  label,
  value,
  tone,
  icon: Icon,
  iconClass,
  activeClass,
  hoverClass,
  onClick,
}: {
  active: boolean;
  label: string;
  value: string;
  tone: string;
  icon: typeof PackageOpen;
  iconClass: string;
  activeClass: string;
  hoverClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-left transition ${hoverClass} ${
        active ? activeClass : "border-gray-100 bg-white"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
          <Icon size={16} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-xs text-gray-400">{label}</span>
          <span className={`block font-semibold ${tone}`}>{value}</span>
        </span>
      </div>
    </button>
  );
}
