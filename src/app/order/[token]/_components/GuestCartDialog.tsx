/**
 * GuestCartDialog แสดงกล่องยืนยันก่อนทำรายการในส่วนการสั่งอาหารผ่าน QR
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import { Minus, Plus, X } from "lucide-react";
import type { CartLine, ModifierGroup, ModifierOption } from "../types";
import { cartLinePrice, guestMoney } from "../utils";

type Props = {
  editing: CartLine | null;
  cart: CartLine[];
  message: string;
  total: number;
  busy: boolean;
  blocked: boolean;
  onEditingChange: (line: CartLine | null) => void;
  onSelectOption: (option: ModifierOption, group: ModifierGroup) => void;
  onSaveLine: () => void;
  onRemove: (lineKey: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function GuestCartDialog({
  editing,
  cart,
  message,
  total,
  busy,
  blocked,
  onEditingChange,
  onSelectOption,
  onSaveLine,
  onRemove,
  onClose,
  onSubmit,
}: Props) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={editing ? "เลือกอาหาร" : "ตรวจตะกร้า"}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {editing ? editing.menu.name : "ตรวจรายการก่อนสั่ง"}
          </h2>
          <button
            disabled={busy}
            aria-label="ปิด"
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2"
          >
            <X size={20} />
          </button>
        </div>

        {message && (
          <p
            role="alert"
            className="mb-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800"
          >
            {message}
          </p>
        )}

        {editing ? (
          <>
            <p className="mb-4 text-sm text-slate-500">
              {editing.menu.description}
            </p>
            {editing.menu.modifierGroups.map((group) => (
              <fieldset key={group.id} className="mb-5">
                <legend className="mb-2 font-medium">
                  {group.name}{" "}
                  <span className="text-xs text-slate-400">
                    เลือก {group.minSelect}–{group.maxSelect}
                  </span>
                </legend>
                <div className="space-y-2">
                  {group.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center gap-3 rounded-xl border p-3"
                    >
                      <input
                        type="checkbox"
                        checked={editing.modifierIds.includes(option.id)}
                        onChange={() => onSelectOption(option, group)}
                      />
                      <span className="flex-1">{option.name}</span>
                      <span className="text-sm text-slate-500">
                        +{guestMoney(option.price)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}
            <label className="block text-sm">
              หมายเหตุ
              <input
                maxLength={500}
                value={editing.note}
                onChange={(event) =>
                  onEditingChange({ ...editing, note: event.target.value })
                }
                placeholder="เช่น ไม่ใส่ผัก"
                className="mt-2 w-full rounded-xl border p-3"
              />
            </label>
            <div className="my-5 flex items-center justify-center gap-6">
              <button
                aria-label="ลดจำนวน"
                disabled={editing.qty <= 1}
                onClick={() =>
                  onEditingChange({ ...editing, qty: editing.qty - 1 })
                }
                className="rounded-full bg-slate-100 p-3 disabled:opacity-30"
              >
                <Minus size={18} />
              </button>
              <b>{editing.qty}</b>
              <button
                aria-label="เพิ่มจำนวน"
                disabled={editing.qty >= 50}
                onClick={() =>
                  onEditingChange({ ...editing, qty: editing.qty + 1 })
                }
                className="rounded-full bg-slate-100 p-3"
              >
                <Plus size={18} />
              </button>
            </div>
            <button
              onClick={onSaveLine}
              className="w-full rounded-xl bg-blue-600 p-4 text-white"
            >
              เพิ่มลงตะกร้า ·{` `}
              {guestMoney(cartLinePrice(editing) * editing.qty)}
            </button>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-500">
              รายการจะส่งเข้าครัวทันทีหลังยืนยัน
            </p>
            {cart.map((line) => (
              <div key={line.key} className="border-b py-3">
                <div className="flex justify-between gap-3">
                  <button
                    disabled={busy}
                    className="text-left"
                    onClick={() => onEditingChange(line)}
                  >
                    {line.qty} × {line.menu.name}
                    <span className="mt-1 block text-xs text-slate-400">
                      {line.menu.modifierGroups
                        .flatMap((group) => group.options)
                        .filter((option) =>
                          line.modifierIds.includes(option.id),
                        )
                        .map((option) => option.name)
                        .join(" · ")}{" "}
                      {line.note}
                    </span>
                    <span className="text-xs text-blue-600">แก้ไข</span>
                  </button>
                  <div className="text-right">
                    {guestMoney(cartLinePrice(line) * line.qty)}
                    <button
                      disabled={busy}
                      aria-label={`ลบ ${line.menu.name}`}
                      onClick={() => onRemove(line.key)}
                      className="ml-auto block p-2 text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div className="my-5 flex justify-between text-lg font-semibold">
              <span>รวมรายการนี้</span>
              <span>{guestMoney(total)}</span>
            </div>
            <button
              disabled={busy || blocked || !cart.length}
              onClick={onSubmit}
              className="w-full rounded-xl bg-blue-600 p-4 text-white disabled:opacity-40"
            >
              {busy
                ? "กำลังส่ง…"
                : blocked
                  ? "โต๊ะพักรับรายการ"
                  : "ยืนยันสั่งอาหาร"}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
