/**
 * RecipeEditor ใช้เพิ่มและแก้ไขข้อมูลในส่วนสูตรอาหาร
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import {
  BookOpenText,
  CheckCircle2,
  Puzzle,
  Save,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import type { Ingredient, Menu, RecipeTarget } from "../types";

function StatusPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
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

type RecipeEditorProps = {
  menu?: Menu;
  targets: RecipeTarget[];
  selectedTarget?: RecipeTarget;
  targetKey: string;
  ingredients: Ingredient[];
  quantities: Record<number, string>;
  message: string;
  saving: boolean;
  onTarget: (key: string) => void;
  onQuantity: (ingredientId: number, value: string) => void;
  onSave: () => void;
};

export default function RecipeEditor({
  menu,
  targets,
  selectedTarget,
  targetKey,
  ingredients,
  quantities,
  message,
  saving,
  onTarget,
  onQuantity,
  onSave,
}: RecipeEditorProps) {
  if (!menu || !selectedTarget) {
    return (
      <section className="min-h-0 overflow-hidden rounded-2xl border border-gray-100 bg-white">
        <div className="grid h-full min-h-[420px] place-items-center p-6 text-center">
          <div>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <BookOpenText size={28} />
            </div>
            <h2 className="mt-4 font-semibold text-gray-900">
              เลือกเมนูเพื่อเริ่มกำหนดสูตร
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              สูตรที่บันทึกจะถูกใช้ตัดสต็อกตอนเปิดออเดอร์
              และแสดงให้ครัวดูตอนทำอาหาร
            </p>
          </div>
        </div>
      </section>
    );
  }

  const usedCount = Object.values(quantities).filter(
    (quantity) => Number(quantity) > 0,
  ).length;

  return (
    <section className="min-h-0 overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="flex h-full min-h-0 flex-col">
        <header className="border-b border-gray-100 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-blue-600">
                {menu.category.name}
              </p>
              <h1 className="mt-1 truncate text-2xl font-semibold text-gray-900">
                {menu.name}
              </h1>
              <p className="mt-1 text-sm text-gray-400">
                กำหนดปริมาณวัตถุดิบที่ใช้ต่อ 1 {menu.saleUnit || "รายการ"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <StatusPill
                icon={UtensilsCrossed}
                label="สูตรในเมนู"
                value={`${targets.length} ชุด`}
              />
              <StatusPill
                icon={CheckCircle2}
                label="วัตถุดิบที่ใช้"
                value={`${usedCount} รายการ`}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {targets.map((target) => {
              const key = `${target.type}:${target.id}`;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onTarget(key)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${key === targetKey ? "border-blue-300 bg-blue-50 text-blue-700" : "border-gray-100 bg-gray-50 text-gray-600 hover:border-blue-100 hover:bg-blue-50/40"}`}
                >
                  {target.type === "menu" ? (
                    <BookOpenText size={16} />
                  ) : (
                    <Puzzle size={16} />
                  )}
                  {target.type === "menu"
                    ? target.label
                    : `${target.groupName}: ${target.label}`}
                </button>
              );
            })}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">
              {selectedTarget.type === "menu"
                ? menu.name
                : selectedTarget.label}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {selectedTarget.type === "menu"
                ? `สูตรเมนูหลักต่อ 1 ${menu.saleUnit || "รายการ"}`
                : `สูตรตัวเลือกในกลุ่ม ${selectedTarget.groupName} ต่อ 1 รายการ`}
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {ingredients.map((ingredient) => (
              <label
                key={ingredient.id}
                className="rounded-xl border border-gray-100 p-3 transition focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-50"
              >
                <span className="block truncate text-sm font-medium text-gray-900">
                  {ingredient.name}
                </span>
                <span className="mt-1 block truncate text-xs text-gray-400">
                  คงเหลือ {ingredient.stock.toLocaleString("th-TH")}{" "}
                  {ingredient.unit}
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={quantities[ingredient.id] || ""}
                    onChange={(event) =>
                      onQuantity(ingredient.id, event.target.value)
                    }
                    placeholder="0"
                    className="min-w-0 flex-1 rounded-lg bg-gray-50 px-3 py-2 text-sm outline-none"
                  />
                  <span className="shrink-0 text-xs text-gray-400">
                    {ingredient.unit}
                  </span>
                </div>
              </label>
            ))}
          </div>
          {!ingredients.length && (
            <p className="mt-10 text-center text-sm text-gray-400">
              ยังไม่มีวัตถุดิบในสต็อก
            </p>
          )}
        </div>

        <footer className="flex flex-col gap-3 border-t border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p
            className={`text-sm ${message.includes("แล้ว") ? "text-emerald-600" : "text-red-500"}`}
          >
            {message}
          </p>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#212A3A] px-5 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:opacity-60"
          >
            <Save size={17} />
            {saving ? "กำลังบันทึก..." : "บันทึกสูตร"}
          </button>
        </footer>
      </div>
    </section>
  );
}
