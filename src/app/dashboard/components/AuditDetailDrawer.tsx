"use client";

import { X } from "lucide-react";
import { Audit, auditBillItems, auditChangeRows, auditDetailRows, auditSummary, money } from "../audit-utils";

type AuditDetailDrawerProps = {
  audit: Audit;
  onClose: () => void;
};

export default function AuditDetailDrawer({ audit, onClose }: AuditDetailDrawerProps) {
  const billItems = auditBillItems(audit);
  const changes = auditChangeRows(audit);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
      <button type="button" aria-label="ปิดรายละเอียดประวัติ" className="hidden flex-1 cursor-default sm:block" onClick={onClose} />
      <div className="h-full w-full overflow-y-auto bg-white p-5 shadow-2xl sm:max-w-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="font-semibold text-gray-900">รายละเอียดประวัติ</h2>
            <p className="mt-1 text-sm text-gray-400">{auditSummary(audit)}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <div className="grid gap-2">
            {auditDetailRows(audit).map((row) => (
              <div key={row.label} className="rounded-xl border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-400">{row.label}</p>
                <p className="mt-1 text-sm font-medium text-gray-800">{row.value}</p>
              </div>
            ))}
          </div>

          {billItems.length > 0 && (
            <div className="rounded-2xl border border-gray-100">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="font-medium text-gray-900">บิลรายการอาหาร</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {billItems.map((item) => (
                  <div key={item.key} className="px-4 py-3">
                    <div className="grid grid-cols-[48px_1fr_auto] gap-3 text-sm">
                      <p className="font-semibold text-gray-800">x{item.qty.toLocaleString("th-TH")}</p>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="mt-1 text-xs text-gray-400">@ {money(item.unitPrice)}</p>
                        {item.modifiers.length > 0 && (
                          <div className="mt-2 space-y-1 text-xs text-gray-500">
                            {item.modifiers.map((modifier) => (
                              <p key={`${item.key}-${modifier.name}`}>+ {modifier.name}{modifier.price ? ` (${money(modifier.price)})` : ""}</p>
                            ))}
                          </div>
                        )}
                        {item.note && <p className="mt-2 text-xs text-gray-500">หมายเหตุ: {item.note}</p>}
                      </div>
                      <p className="whitespace-nowrap font-semibold text-gray-900">{money(item.lineTotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between text-gray-500">
                  <span>จำนวนรวม</span>
                  <span>{billItems.reduce((sum, item) => sum + item.qty, 0).toLocaleString("th-TH")} รายการ</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-gray-900">
                  <span>ยอดสุทธิ</span>
                  <span>{money(audit.details?.total ?? billItems.reduce((sum, item) => sum + item.lineTotal, 0))}</span>
                </div>
              </div>
            </div>
          )}

          {changes.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900">ค่าที่เปลี่ยนแปลง</h3>
              <div className="mt-2 grid gap-2">
                {changes.map((row) => (
                  <div key={row.label} className="rounded-xl border border-gray-100 px-4 py-3 text-sm">
                    <p className="font-medium text-gray-800">{row.label}</p>
                    <p className="mt-1 text-gray-500">{row.before ? `${row.before} -> ${row.after || "-"}` : row.after}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
