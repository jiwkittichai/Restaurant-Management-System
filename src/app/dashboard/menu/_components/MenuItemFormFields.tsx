/**
 * MenuItemFormFields เป็นฟอร์มสำหรับเมนูอาหาร
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import type { MenuCategory, MenuItemForm } from "../types";

export default function MenuItemFormFields({
  form,
  categories,
  onChange,
}: {
  form: MenuItemForm;
  categories: MenuCategory[];
  onChange: (patch: Partial<MenuItemForm>) => void;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="ชื่อเมนู"
          value={form.name}
          onChange={(name) => onChange({ name })}
        />
        <Field
          label="รหัสเมนู"
          value={form.sku}
          onChange={(sku) => onChange({ sku })}
        />
      </div>
      <label className="block text-sm text-gray-600">
        รายละเอียด
        <textarea
          value={form.description}
          onChange={(event) =>
            onChange({ description: event.target.value })
          }
          className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400"
          rows={3}
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="ราคา"
          type="number"
          value={form.price}
          onChange={(price) => onChange({ price })}
        />
        <SaleUnitField
          value={form.saleUnit}
          onChange={(saleUnit) => onChange({ saleUnit })}
        />
        <label className="text-sm text-gray-600">
          หมวดหมู่
          <select
            required
            value={form.categoryId}
            onChange={(event) =>
              onChange({ categoryId: event.target.value })
            }
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3"
          >
            <option value="">เลือกหมวดหมู่</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="text-sm text-gray-600">
      {label}
      <input
        required
        type={type}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400"
      />
    </label>
  );
}

function SaleUnitField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm text-gray-600">
      หน่วยขาย
      <input
        required
        list="sale-unit-options"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="เช่น จาน"
        className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400"
      />
      <datalist id="sale-unit-options">
        {["จาน", "ชาม", "ถ้วย", "แก้ว", "ขวด", "ชิ้น"].map((unit) => (
          <option key={unit} value={unit} />
        ))}
      </datalist>
    </label>
  );
}
