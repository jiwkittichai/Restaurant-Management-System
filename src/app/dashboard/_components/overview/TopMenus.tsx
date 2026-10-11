import { money } from "./utils";

export type TopMenu = { name: string; qty: number; total: number };

export default function TopMenus({ items }: { items: TopMenu[] }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
      <h2 className="font-semibold text-gray-900">เมนูขายดีวันนี้</h2>
      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div key={`${item.name}-${index}`} className="flex items-center gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-xs text-blue-600">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
              <p className="text-xs text-gray-400">{item.qty} รายการ</p>
            </div>
            <span className="whitespace-nowrap text-sm font-medium text-gray-900 sm:text-base">{money(item.total, 2)}</span>
          </div>
        ))}
        {!items.length && <p className="text-sm text-gray-400">ยังไม่มีข้อมูลเมนูขายดีวันนี้</p>}
      </div>
    </div>
  );
}
