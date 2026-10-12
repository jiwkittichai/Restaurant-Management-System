"use client";

import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Banknote, Clock3, Database, FileClock, Hash, MapPin, ReceiptText, UserRound, Utensils } from "lucide-react";
import { useRouter } from "next/navigation";
import { actionText } from "../labels";
import { asText, auditActorName, detailValue } from "../formatters";
import { formatRelativeDate } from "../../formatters";
import { auditBillItems, auditChangeRows, auditDetailRows, auditSummary } from "../detail-builders";
import type { Audit } from "../types";

function billMoney(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "฿0.00";
  return `฿${amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function DetailTile({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 gap-3 bg-white p-4 sm:p-5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gray-50 text-gray-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <div className="mt-1 break-words text-sm font-medium text-gray-900">{children}</div>
      </div>
    </div>
  );
}

const entityTypeText: Record<string, string> = {
  Category: "หมวดหมู่",
  Employee: "บัญชีพนักงาน",
  Ingredient: "วัตถุดิบ",
  MenuItem: "เมนูอาหาร",
  MenuItemModifier: "ตัวเลือกเมนู",
  Order: "ออเดอร์",
  PaymentSettings: "การตั้งค่าชำระเงิน",
  Restaurant: "ข้อมูลร้าน",
  RestaurantTable: "โต๊ะอาหาร",
};

function AuditDetailsSection({ rows, gridClass }: { rows: Array<{ label: string; value: string }>; gridClass: string }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
        <h2 className="font-semibold text-gray-900">รายละเอียดการทำรายการ</h2>
        <p className="mt-1 text-xs text-gray-400">ข้อมูลที่บันทึกไว้ ณ เวลาทำรายการ</p>
      </div>
      <dl className={`grid gap-3 p-4 sm:p-5 ${gridClass}`}>
        {rows.map((row) => (
          <div key={row.label} className="min-w-0 rounded-xl bg-gray-50 px-4 py-3.5">
            <dt className="text-xs text-gray-400">{row.label}</dt>
            <dd className="mt-1 break-words text-sm font-medium text-gray-900">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ChangesSection({ changes, compact = false }: { changes: Array<{ label: string; before?: string; after?: string }>; compact?: boolean }) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-gray-100 bg-white ${compact ? "lg:sticky lg:top-6" : ""}`}>
      <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
        <h2 className="font-semibold text-gray-900">สรุปการเปลี่ยนแปลง</h2>
        <p className="mt-1 text-xs text-gray-400">เปรียบเทียบค่าก่อนและหลังทำรายการ</p>
      </div>
      <div className="divide-y divide-gray-100">
        {changes.map((row) => (
          <div key={row.label} className={`grid gap-3 px-4 py-4 text-sm sm:px-5 ${compact ? "" : "sm:grid-cols-[minmax(140px,0.35fr)_1fr] sm:items-center"}`}>
            <p className="font-medium text-gray-900">{row.label}</p>
            {row.before !== undefined ? (
              <div className="flex min-w-0 items-center gap-2">
                <div className="min-w-0 flex-1 rounded-xl bg-gray-50 px-3 py-2.5">
                  <p className="text-[11px] text-gray-400">ก่อน</p>
                  <p className="mt-0.5 break-words font-medium text-gray-600">{row.before || "-"}</p>
                </div>
                <ArrowRight size={16} className="shrink-0 text-gray-300" />
                <div className="min-w-0 flex-1 rounded-xl bg-blue-50 px-3 py-2.5">
                  <p className="text-[11px] text-blue-400">หลัง</p>
                  <p className="mt-0.5 break-words font-medium text-blue-700">{row.after || "-"}</p>
                </div>
              </div>
            ) : (
              <p className="break-words rounded-xl bg-blue-50 px-3 py-2.5 font-medium text-blue-700">{row.after || "-"}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AuditDetailPage({ audit }: { audit: Audit }) {
  const router = useRouter();
  const billItems = auditBillItems(audit);
  const changes = auditChangeRows(audit);
  const billItemCount = billItems.reduce((sum, item) => sum + item.qty, 0);
  const billTotal = audit.details?.total ?? billItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const orderNumber = asText(detailValue(audit.details, "orderNumber")) || `ออเดอร์ #${audit.entityId || "-"}`;
  const orderType = asText(detailValue(audit.details, "type")) || "ไม่ระบุ";
  const tableName = asText(detailValue(audit.details, "tableName"));
  const queueNumber = asText(detailValue(audit.details, "queueNumber"));
  const paymentMethod = asText(detailValue(audit.details, "method"));
  const orderLocation = tableName || (queueNumber ? `คิว ${queueNumber}` : orderType);
  const billSubtotal = detailValue(audit.details, "subtotal") ?? billItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const billDiscount = detailValue(audit.details, "discount") ?? 0;
  const receivedAmount = detailValue(audit.details, "receivedAmount");
  const changeAmount = detailValue(audit.details, "changeAmount");
  const entityName = entityTypeText[audit.entityType] || audit.entityType || "ข้อมูลระบบ";
  const hiddenDetailLabels = new Set([
    "ผู้ทำรายการ",
    "เวลา",
    "ประเภท",
    ...(billItems.length ? [
      "เลขออเดอร์", "ประเภทออเดอร์", "วิธีชำระเงิน", "ยอดเงิน", "ยอดก่อนส่วนลด", "ส่วนลด",
      "เงินรับ", "เงินทอน", "รหัสการชำระเงิน", "จำนวนรายการ", "โต๊ะ", "คิว",
    ] : []),
  ]);
  const detailRows = auditDetailRows(audit).filter((row) => !hiddenDetailLabels.has(row.label));
  const detailGridColumns = detailRows.length === 1
    ? "grid-cols-1"
    : detailRows.length === 2 || detailRows.length === 4
      ? "sm:grid-cols-2"
      : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-4 px-3 py-4 sm:space-y-5 sm:p-6 lg:p-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600"
      >
        <ArrowLeft size={17} />
        กลับ
      </button>

      {billItems.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 sm:h-12 sm:w-12">
                  <ReceiptText size={22} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium text-gray-400">เลขออเดอร์</p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${audit.action === "PAY_ORDER" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
                      {audit.action === "PAY_ORDER" ? "ชำระเงินแล้ว" : actionText[audit.action] || audit.action}
                    </span>
                  </div>
                  <h2 className="mt-1 break-all text-lg font-semibold text-gray-900 sm:text-xl">{orderNumber}</h2>
                  <p className="mt-1 text-xs text-gray-400">ทำรายการโดย <span className="font-medium text-gray-600">{auditActorName(audit)}</span></p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3 sm:block sm:bg-transparent sm:p-0 sm:text-right">
                <p className="text-xs text-gray-400">{audit.action === "PAY_ORDER" ? "ยอดสุทธิ" : "ยอดรวม"}</p>
                <p className="text-2xl font-semibold tracking-tight text-blue-600 sm:mt-1 sm:text-3xl">{billMoney(billTotal)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px border-t border-gray-100 bg-gray-100 lg:grid-cols-4">
            <DetailTile icon={<MapPin size={17} />} label="โต๊ะ / จุดรับอาหาร">{orderLocation}</DetailTile>
            <DetailTile icon={<Utensils size={17} />} label="ประเภทออเดอร์">{orderType}</DetailTile>
            <DetailTile icon={<Banknote size={17} />} label="ช่องทางชำระเงิน">{paymentMethod || "ยังไม่ชำระเงิน"}</DetailTile>
            <DetailTile icon={<Clock3 size={17} />} label={audit.action === "PAY_ORDER" ? "เวลาชำระเงิน" : "เวลาทำรายการ"}>{formatRelativeDate(audit.createdAt)}</DetailTile>
          </div>
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="p-4 sm:p-5">
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 sm:h-12 sm:w-12">
                <FileClock size={21} />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-medium text-gray-400">รายละเอียดประวัติ</p>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
                    {actionText[audit.action] || audit.action}
                  </span>
                </div>
                <h2 className="mt-1 break-words text-lg font-semibold text-gray-900 sm:text-xl">{auditSummary(audit)}</h2>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px border-t border-gray-100 bg-gray-100 lg:grid-cols-4">
            <DetailTile icon={<UserRound size={17} />} label="ผู้ทำรายการ">{auditActorName(audit)}</DetailTile>
            <DetailTile icon={<Clock3 size={17} />} label="เวลาทำรายการ">{formatRelativeDate(audit.createdAt)}</DetailTile>
            <DetailTile icon={<Database size={17} />} label="ประเภทข้อมูล">{entityName}</DetailTile>
            <DetailTile icon={<Hash size={17} />} label="รหัสรายการ">{audit.id.toLocaleString("th-TH")}</DetailTile>
          </div>
        </section>
      )}

      {billItems.length > 0 && (
        <div className="grid items-start gap-4 sm:gap-5 lg:grid-cols-[1fr_340px]">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900">{audit.action === "ADD_ORDER_ITEMS" ? "รายการที่สั่งเพิ่มครั้งนี้" : "รายการอาหาร"}</h2>
                <p className="mt-1 text-sm text-gray-400">
                  {audit.details?.itemsSource === "current" ? "ข้อมูลเมนูจากออเดอร์ปัจจุบัน" : "รายละเอียดเมนู ณ เวลาทำรายการ"}
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-500">
                {billItemCount.toLocaleString("th-TH")} รายการ
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {billItems.map((item) => (
                <div key={item.key} className="p-4 sm:px-5 sm:py-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gray-50 text-sm font-semibold text-blue-600">
                      {item.qty.toLocaleString("th-TH")}x
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="shrink-0 font-semibold text-gray-900">{billMoney(item.lineTotal)}</p>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">{billMoney(item.unitPrice)} / หน่วย</p>
                      {item.modifiers.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.modifiers.map((modifier) => (
                            <span key={`${item.key}-${modifier.name}`} className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-600">
                              + {modifier.name}{modifier.price ? ` ${billMoney(modifier.price)}` : ""}
                            </span>
                          ))}
                        </div>
                      )}
                      {item.note && <p className="mt-2 rounded-lg bg-gray-50 px-2.5 py-2 text-xs text-gray-600">หมายเหตุ: {item.note}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 lg:sticky lg:top-6">
            <h2 className="font-semibold text-gray-900">{audit.action === "PAY_ORDER" ? "สรุปการชำระเงิน" : "สรุปรายการ"}</h2>
            <p className="mt-1 text-xs text-gray-400">{paymentMethod ? `ชำระผ่าน ${paymentMethod}` : "ข้อมูล ณ เวลาทำรายการ"}</p>
            <div className="mt-5 space-y-3 text-sm">
              {audit.action === "PAY_ORDER" ? (
                <>
                  <div className="flex justify-between gap-4 text-gray-500"><span>ยอดอาหาร</span><span className="font-medium text-gray-700">{billMoney(billSubtotal)}</span></div>
                  <div className="flex justify-between gap-4 text-gray-500"><span>ส่วนลด</span><span className="font-medium text-gray-700">{billMoney(billDiscount)}</span></div>
                  {receivedAmount !== undefined && <div className="flex justify-between gap-4 text-gray-500"><span>รับเงิน</span><span className="font-medium text-gray-700">{billMoney(receivedAmount)}</span></div>}
                  {changeAmount !== undefined && <div className="flex justify-between gap-4 text-gray-500"><span>เงินทอน</span><span className="font-medium text-gray-700">{billMoney(changeAmount)}</span></div>}
                </>
              ) : (
                <div className="flex justify-between gap-4 text-gray-500">
                  <span>จำนวนรวม</span>
                  <span className="font-medium text-gray-700">{billItemCount.toLocaleString("th-TH")} รายการ</span>
                </div>
              )}
            </div>
            <div className="mt-5 border-t border-gray-100 pt-4">
              <div className="flex items-end justify-between gap-3">
                <span className="font-semibold text-gray-900">{audit.action === "ADD_ORDER_ITEMS" ? "ยอดรวมหลังสั่งเพิ่ม" : audit.action === "PAY_ORDER" ? "รวมสุทธิ" : "ยอดสุทธิ"}</span>
                <span className="text-2xl font-semibold tracking-tight text-blue-600">{billMoney(billTotal)}</span>
              </div>
            </div>
          </section>
        </div>
      )}

      {billItems.length === 0 && (detailRows.length > 0 || changes.length > 0) && (
        <div className={`grid items-start gap-4 sm:gap-5 ${detailRows.length > 0 && changes.length > 0 ? "lg:grid-cols-[1fr_380px]" : ""}`}>
          {detailRows.length > 0 && <AuditDetailsSection rows={detailRows} gridClass={detailGridColumns} />}
          {changes.length > 0 && <ChangesSection changes={changes} compact={detailRows.length > 0} />}
        </div>
      )}

      {billItems.length > 0 && changes.length > 0 && <ChangesSection changes={changes} />}
    </div>
  );
}
