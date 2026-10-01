"use client";

import { ArrowLeft, Clock3, FileClock, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Audit, actionText, auditActorName, auditBillItems, auditChangeRows, auditDetailRows, auditSummary, formatDate, money } from "../utils";

export default function AuditDetailPage({ audit }: { audit: Audit }) {
  const router = useRouter();
  const billItems = auditBillItems(audit);
  const changes = auditChangeRows(audit);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600">
        <ArrowLeft size={17} />
        กลับหน้าประวัติ
      </button>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><FileClock size={21} /></span>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900">รายละเอียดประวัติ</h2>
              <p className="mt-1 break-words text-sm text-gray-500">{auditSummary(audit)}</p>
            </div>
          </div>
          <span className="w-fit shrink-0 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600">{actionText[audit.action] || audit.action}</span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
            <UserRound size={18} className="shrink-0 text-gray-400" />
            <div><p className="text-xs text-gray-400">ผู้ทำรายการ</p><p className="mt-1 text-sm font-medium text-gray-900">{auditActorName(audit)}</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
            <Clock3 size={18} className="shrink-0 text-gray-400" />
            <div><p className="text-xs text-gray-400">เวลา</p><p className="mt-1 text-sm font-medium text-gray-900">{formatDate(audit.createdAt)}</p></div>
          </div>
        </div>

        <dl className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {auditDetailRows(audit).filter(row => !["ผู้ทำรายการ", "เวลา"].includes(row.label)).map((row) => (
            <div key={row.label} className="rounded-xl border border-gray-100 px-4 py-3">
              <dt className="text-xs text-gray-400">{row.label}</dt>
              <dd className="mt-1 break-words text-sm font-medium text-gray-800">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {billItems.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">{audit.action === "ADD_ORDER_ITEMS" ? "รายการที่สั่งเพิ่มครั้งนี้" : "บิลรายการอาหาร"}</h2>
            <p className="mt-1 text-xs text-gray-500">{audit.details?.itemsSource === "current" ? "ข้อมูลจากออเดอร์ปัจจุบัน — ประวัตินี้ไม่มีสำเนารายการ ณ เวลาทำรายการ" : "รายการที่บันทึกไว้ ณ เวลาทำรายการ"}</p>
          </div>
          <div className="divide-y divide-gray-100">
            {billItems.map((item) => (
              <div key={item.key} className="px-5 py-4">
                <div className="grid grid-cols-[48px_1fr_auto] gap-3 text-sm">
                  <p className="font-semibold text-gray-800">x{item.qty.toLocaleString("th-TH")}</p>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="mt-1 text-xs text-gray-400">@ {money(item.unitPrice)}</p>
                    {item.modifiers.map(modifier => <p key={`${item.key}-${modifier.name}`} className="mt-1 text-xs text-gray-500">+ {modifier.name}{modifier.price ? ` (${money(modifier.price)})` : ""}</p>)}
                    {item.note && <p className="mt-2 text-xs text-gray-500">หมายเหตุ: {item.note}</p>}
                  </div>
                  <p className="whitespace-nowrap font-semibold text-gray-900">{money(item.lineTotal)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-gray-100 bg-gray-50 px-5 py-4 text-sm">
            <div className="flex items-center justify-between text-gray-500"><span>จำนวนรวม</span><span>{billItems.reduce((sum, item) => sum + item.qty, 0).toLocaleString("th-TH")} รายการ</span></div>
            <div className="flex items-center justify-between font-semibold text-gray-900"><span>{audit.action === "ADD_ORDER_ITEMS" ? "ยอดรวมทั้งบิลหลังสั่งเพิ่ม" : "ยอดสุทธิ"}</span><span>{money(audit.details?.total ?? billItems.reduce((sum, item) => sum + item.lineTotal, 0))}</span></div>
          </div>
        </section>
      )}

      {changes.length > 0 && (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
          <h2 className="font-semibold text-gray-900">ค่าที่เปลี่ยนแปลง</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {changes.map(row => (
              <div key={row.label} className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
                <p className="font-medium text-gray-800">{row.label}</p>
                <p className="mt-1 break-words text-gray-500">{row.before ? `${row.before} → ${row.after || "-"}` : row.after}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
