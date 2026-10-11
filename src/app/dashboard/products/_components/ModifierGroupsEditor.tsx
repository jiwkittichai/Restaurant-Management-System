import type { ModifierGroupDraft, ModifierOptionDraft } from "../types";

export default function ModifierGroupsEditor({
  groups,
  onChange,
}: {
  groups: ModifierGroupDraft[];
  onChange: (groups: ModifierGroupDraft[]) => void;
}) {
  function updateGroup(index: number, patch: Partial<ModifierGroupDraft>) {
    onChange(
      groups.map((group, groupIndex) =>
        groupIndex === index ? { ...group, ...patch } : group,
      ),
    );
  }
  function updateOption(
    groupIndex: number,
    optionIndex: number,
    patch: Partial<ModifierOptionDraft>,
  ) {
    onChange(
      groups.map((group, currentGroupIndex) =>
        currentGroupIndex !== groupIndex
          ? group
          : {
              ...group,
              options: group.options.map((option, currentOptionIndex) =>
                currentOptionIndex === optionIndex
                  ? { ...option, ...patch }
                  : option,
              ),
            },
      ),
    );
  }
  return (
    <section className="rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-gray-900">กลุ่มตัวเลือก</h2>
          <p className="text-xs text-gray-400">ตั้งค่าตัวเลือกเสริมของเมนู</p>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange([
              ...groups,
              {
                name: "",
                required: false,
                minSelect: "0",
                maxSelect: "1",
                options: [{ name: "", price: "0" }],
              },
            ])
          }
          className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-600"
        >
          เพิ่มกลุ่ม
        </button>
      </div>
      <div className="mt-4 space-y-4">
        {groups.map((group, index) => (
          <div key={index} className="rounded-xl border border-gray-100 p-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_110px_110px]">
              <EditorField
                label="ชื่อกลุ่ม"
                value={group.name}
                onChange={(name) => updateGroup(index, { name })}
              />
              <EditorField
                label="เลือกต่ำสุด"
                type="number"
                value={group.minSelect}
                onChange={(minSelect) => updateGroup(index, { minSelect })}
              />
              <EditorField
                label="เลือกสูงสุด"
                type="number"
                value={group.maxSelect}
                onChange={(maxSelect) => updateGroup(index, { maxSelect })}
              />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={group.required}
                onChange={(event) =>
                  updateGroup(index, {
                    required: event.target.checked,
                    minSelect:
                      event.target.checked && group.minSelect === "0"
                        ? "1"
                        : group.minSelect,
                  })
                }
                className="h-4 w-4 accent-blue-600"
              />
              บังคับเลือก
            </label>
            <div className="mt-3 space-y-2">
              {group.options.map((option, optionIndex) => (
                <div
                  key={optionIndex}
                  className="grid gap-2 sm:grid-cols-[1fr_120px_40px]"
                >
                  <input
                    value={option.name}
                    onChange={(event) =>
                      updateOption(index, optionIndex, {
                        name: event.target.value,
                      })
                    }
                    placeholder="ชื่อตัวเลือก"
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={option.price}
                    onChange={(event) =>
                      updateOption(index, optionIndex, {
                        price: event.target.value,
                      })
                    }
                    placeholder="ราคาเพิ่ม"
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateGroup(index, {
                        options: group.options.filter(
                          (_, currentIndex) => currentIndex !== optionIndex,
                        ),
                      })
                    }
                    className="rounded-xl bg-red-50 text-red-500"
                  >
                    ลบ
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  updateGroup(index, {
                    options: [...group.options, { name: "", price: "0" }],
                  })
                }
                className="rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-600"
              >
                เพิ่มตัวเลือก
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange(
                    groups.filter((_, currentIndex) => currentIndex !== index),
                  )
                }
                className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-500"
              >
                ลบกลุ่ม
              </button>
            </div>
          </div>
        ))}
      </div>
      {!groups.length && (
        <p className="mt-4 text-sm text-gray-400">
          เมนูนี้ยังไม่มีตัวเลือกเพิ่มเติม
        </p>
      )}
    </section>
  );
}

function EditorField({
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
        type={type}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none"
      />
    </label>
  );
}
