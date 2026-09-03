"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpenText, CheckCircle2, Puzzle, Save, Search, UtensilsCrossed } from "lucide-react";

type Ingredient = { id: number; name: string; unit: string; stock: number; minStock: number };
type Recipe = { ingredientId: number; quantity: number; ingredient: Ingredient };
type ModifierOption = { id: number; name: string; price: number; recipes: Recipe[] };
type ModifierGroup = { id: number; name: string; required: boolean; minSelect: number; maxSelect: number; options: ModifierOption[] };
type Menu = { id: number; name: string; saleUnit: string; category: { name: string }; recipes: Recipe[]; modifierGroups: ModifierGroup[] };
type RecipeTarget = { type: "menu"; id: number; label: string; recipes: Recipe[] } | { type: "modifier"; id: number; label: string; groupName: string; recipes: Recipe[] };

export default function RecipesPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [menu, setMenu] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState("");
  const [targetKey, setTargetKey] = useState("");
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    () => Promise.all([fetch("/api/inventory").then((r) => r.json()), fetch("/api/recipes").then((r) => r.json())]).then(([i, m]) => {
      setIngredients(Array.isArray(i) ? i : []);
      setMenu(Array.isArray(m) ? m : []);
    }),
    [],
  );

  useEffect(() => { load(); }, [load]);

  const filteredMenu = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return menu;
    return menu.filter((item) => `${item.name} ${item.category.name}`.toLowerCase().includes(query));
  }, [menu, search]);
  const selected = useMemo(() => menu.find((item) => item.id === Number(selectedMenu)), [menu, selectedMenu]);
  const recipeTargets = useMemo<RecipeTarget[]>(() => {
    if (!selected) return [];
    return [
      { type: "menu", id: selected.id, label: "สูตรเมนูหลัก", recipes: selected.recipes },
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
  const usedCount = Object.values(quantities).filter((quantity) => Number(quantity) > 0).length;

  useEffect(() => {
    if (!selected) {
      setTargetKey("");
      return;
    }
    setTargetKey(`menu:${selected.id}`);
  }, [selected]);

  useEffect(() => {
    const next: Record<number, string> = {};
    selectedTarget?.recipes.forEach((recipe) => {
      next[recipe.ingredientId] = String(recipe.quantity);
    });
    setQuantities(next);
  }, [selectedTarget?.type, selectedTarget?.id]);

  function chooseMenu(item: Menu) {
    setSelectedMenu(String(item.id));
    setMessage("");
  }

  async function saveRecipe() {
    if (!selectedTarget) return;
    setSaving(true);
    setMessage("");
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
    setSaving(false);
    if (!response.ok) return setMessage(data.error || "บันทึกสูตรอาหารไม่สำเร็จ");
    setMessage("บันทึกสูตรอาหารแล้ว");
    load();
  }

  return (
    <div className="grid min-h-0 gap-5 overflow-y-auto p-4 sm:p-6 xl:h-[calc(100dvh-96px)] xl:grid-cols-[360px_minmax(0,1fr)] xl:overflow-hidden">
      <aside className="flex min-h-0 flex-col rounded-2xl border border-gray-100 bg-white p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <BookOpenText size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900">สูตรอาหาร</h2>
            <p className="mt-0.5 text-sm text-gray-400">เลือกเมนูเพื่อกำหนดวัตถุดิบต่อ 1 รายการ</p>
          </div>
        </div>
        <div className="relative mt-4">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ค้นหาเมนูอาหาร"
            className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-10 pr-4 text-sm font-medium outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
          />
        </div>
        <div className="mt-4 min-h-0 space-y-2 overflow-y-auto pr-1">
          {filteredMenu.map((item) => {
            const active = selectedMenu === String(item.id);
            const recipeCount = item.recipes.length + item.modifierGroups.reduce((sum, group) => sum + group.options.filter((option) => option.recipes.length > 0).length, 0);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => chooseMenu(item)}
                className={`w-full rounded-xl border p-3 text-left transition ${active ? "border-blue-300 bg-blue-50" : "border-gray-100 hover:border-blue-100 hover:bg-blue-50/40"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{item.name}</p>
                    <p className="mt-1 truncate text-xs text-gray-400">{item.category.name} · {item.saleUnit || "รายการ"}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${recipeCount ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {recipeCount ? `${recipeCount} สูตร` : "ยังไม่มีสูตร"}
                  </span>
                </div>
              </button>
            );
          })}
          {!filteredMenu.length && <p className="py-10 text-center text-sm text-gray-400">ไม่พบเมนูอาหาร</p>}
        </div>
      </aside>

      <section className="min-h-0 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        {selected && selectedTarget ? (
          <div className="flex h-full min-h-0 flex-col">
            <header className="border-b border-gray-100 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-blue-600">{selected.category.name}</p>
                  <h1 className="mt-1 truncate text-2xl font-semibold text-gray-900">{selected.name}</h1>
                  <p className="mt-1 text-sm text-gray-400">กำหนดปริมาณวัตถุดิบที่ใช้ต่อ 1 {selected.saleUnit || "รายการ"}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <StatusPill icon={UtensilsCrossed} label="สูตรในเมนู" value={`${recipeTargets.length} ชุด`} />
                  <StatusPill icon={CheckCircle2} label="วัตถุดิบที่ใช้" value={`${usedCount} รายการ`} />
                </div>
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {recipeTargets.map((target) => {
                  const key = `${target.type}:${target.id}`;
                  const active = key === targetKey;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setTargetKey(key);
                        setMessage("");
                      }}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${active ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-100 bg-gray-50 text-gray-600 hover:border-blue-100 hover:bg-blue-50/40"}`}
                    >
                      {target.type === "menu" ? <BookOpenText size={16} /> : <Puzzle size={16} />}
                      {target.type === "menu" ? target.label : `${target.groupName}: ${target.label}`}
                    </button>
                  );
                })}
              </div>
              {selected.modifierGroups.length === 0 && <p className="mt-2 text-sm text-gray-400">เมนูนี้ยังไม่มีตัวเลือก จึงมีเฉพาะสูตรเมนูหลัก</p>}
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">{selectedTarget.type === "menu" ? selected.name : selectedTarget.label}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {selectedTarget.type === "menu" ? `สูตรเมนูหลักต่อ 1 ${selected.saleUnit || "รายการ"}` : `สูตรตัวเลือกในกลุ่ม ${selectedTarget.groupName} ต่อ 1 รายการ`}
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {ingredients.map((ingredient) => (
                  <label key={ingredient.id} className="rounded-xl border border-gray-100 p-3 transition focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-50">
                    <span className="block truncate text-sm font-medium text-gray-900">{ingredient.name}</span>
                    <span className="mt-1 block truncate text-xs text-gray-400">คงเหลือ {ingredient.stock.toLocaleString("th-TH")} {ingredient.unit}</span>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={quantities[ingredient.id] || ""}
                        onChange={(event) => setQuantities({ ...quantities, [ingredient.id]: event.target.value })}
                        placeholder="0"
                        className="min-w-0 flex-1 rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none"
                      />
                      <span className="shrink-0 text-xs text-gray-400">{ingredient.unit}</span>
                    </div>
                  </label>
                ))}
              </div>
              {!ingredients.length && <p className="mt-10 text-center text-sm text-gray-400">ยังไม่มีวัตถุดิบในสต็อก</p>}
            </div>

            <footer className="flex flex-col gap-3 border-t border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className={`text-sm ${message.includes("แล้ว") ? "text-emerald-600" : "text-red-500"}`}>{message}</p>
              <button
                type="button"
                onClick={saveRecipe}
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#212A3A] px-5 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:opacity-60"
              >
                <Save size={17} />
                {saving ? "กำลังบันทึก..." : "บันทึกสูตร"}
              </button>
            </footer>
          </div>
        ) : (
          <div className="grid h-full min-h-[420px] place-items-center p-6 text-center">
            <div>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <BookOpenText size={28} />
              </div>
              <h2 className="mt-4 font-semibold text-gray-900">เลือกเมนูเพื่อเริ่มกำหนดสูตร</h2>
              <p className="mt-1 text-sm text-gray-400">สูตรที่บันทึกจะถูกใช้ตัดสต็อกตอนเปิดออเดอร์ และแสดงให้ครัวดูตอนทำอาหาร</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StatusPill({ icon: Icon, label, value }: { icon: typeof BookOpenText; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 px-3 py-2">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-blue-600" />
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <p className="mt-1 font-semibold text-gray-900">{value}</p>
    </div>
  );
}
