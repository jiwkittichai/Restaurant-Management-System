import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Banknote, Clock3, MapPin, ReceiptText, UserRound, Utensils } from "lucide-react";
import { StaffRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CopyOrderNumber from "../../../_components/CopyOrderNumber";

const methodText: Record<string, string> = { CASH: "เงินสด", PROMPTPAY: "พร้อมเพย์", CARD: "บัตร" };
const orderTypeText: Record<string, string> = { DINE_IN: "ทานที่ร้าน", TAKEAWAY: "ซื้อกลับบ้าน" };

function money(value: number | { toString(): string }) {
  const amount = Number(value);
  return `฿${amount.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function dateTime(value: Date) {
  return value.toLocaleString("th-TH", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "Asia/Bangkok",
  });
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

export default async function ReportOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.roles.includes(StaffRole.OWNER)) redirect("/dashboard");

  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();

  const order = await prisma.order.findFirst({
    where: {
      id,
      restaurantId: user.restaurantId,
      paymentStatus: "PAID",
      payment: { isNot: null },
    },
    include: {
      table: true,
      payment: true,
      items: { include: { menuItem: true, modifiers: true } },
    },
  });
  if (!order?.payment) notFound();

  const returnValue = (await searchParams).returnTo;
  const requestedReturnHref = Array.isArray(returnValue) ? returnValue[0] : returnValue;
  const returnHref = requestedReturnHref && /^\/dashboard\/reports(?:\?[^#]*)?$/.test(requestedReturnHref)
    ? requestedReturnHref
    : "/dashboard/reports";

  const placeLabel = order.type === "TAKEAWAY" ? "หมายเลขคิว" : "โต๊ะอาหาร";
  const placeValue = order.type === "TAKEAWAY" ? order.queueNumber || "ไม่ระบุคิว" : order.table?.name || "ไม่ระบุโต๊ะ";
  const payment = order.payment;
  const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-4 px-3 py-4 sm:space-y-5 sm:p-6 lg:p-8">
      <Link
        href={returnHref}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600"
      >
        <ArrowLeft size={17} />
        กลับ
      </Link>

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
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">ชำระเงินแล้ว</span>
                </div>
                <div className="flex items-center gap-1"><h2 className="mt-1 break-all text-lg font-semibold text-gray-900 sm:text-xl">{order.orderNumber}</h2><CopyOrderNumber value={order.orderNumber} /></div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3 sm:block sm:bg-transparent sm:p-0 sm:text-right">
              <p className="text-xs text-gray-400">ยอดสุทธิ</p>
              <div className="text-right">
                <p className="text-2xl font-semibold tracking-tight text-blue-600 sm:mt-1 sm:text-3xl">{money(order.total)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px border-t border-gray-100 bg-gray-100 lg:grid-cols-4">
          <DetailTile icon={<MapPin size={17} />} label={placeLabel}>
            {placeValue}
          </DetailTile>
          <DetailTile icon={<Utensils size={17} />} label="ประเภทออเดอร์">
            {orderTypeText[order.type] || order.type}
          </DetailTile>
          <DetailTile icon={<Banknote size={17} />} label="ช่องทางชำระเงิน">
            {methodText[payment.method] || payment.method}
          </DetailTile>
          <DetailTile icon={<Clock3 size={17} />} label="เวลาชำระเงิน">
            {dateTime(payment.paidAt)}
          </DetailTile>
        </div>

        {(order.note || order.customerName || order.customerPhone) && (
          <div className="grid gap-4 border-t border-gray-100 px-4 py-4 sm:grid-cols-2 sm:px-5">
            {order.note && (
              <div>
                <p className="text-xs text-gray-400">หมายเหตุออเดอร์</p>
                <p className="mt-1 break-words text-sm font-medium text-gray-900">{order.note}</p>
              </div>
            )}
            {(order.customerName || order.customerPhone) && (
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gray-50 text-gray-400"><UserRound size={17} /></span>
                <div>
                  <p className="text-xs text-gray-400">ข้อมูลลูกค้า</p>
                  <p className="mt-1 text-sm font-medium text-gray-900">{order.customerName || "ไม่ระบุชื่อ"}</p>
                  {order.customerPhone && <p className="mt-0.5 text-sm text-gray-500">{order.customerPhone}</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="grid items-start gap-4 sm:gap-5 lg:grid-cols-[1fr_340px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-semibold text-gray-900">รายการอาหาร</h2>
              <p className="mt-1 text-sm text-gray-400">รายละเอียดเมนูในออเดอร์นี้</p>
            </div>
            <span className="shrink-0 rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-500">{itemCount.toLocaleString("th-TH")} รายการ</span>
          </div>
          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="p-4 sm:px-5 sm:py-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gray-50 text-sm font-semibold text-blue-600">{item.qty}x</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="shrink-0 font-semibold text-gray-900">{money(Number(item.price) * item.qty)}</p>
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{money(item.price)} / {item.menuItem.saleUnit || "หน่วย"}</p>
                    {!!item.modifiers.length && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.modifiers.map((modifier) => (
                          <span key={modifier.id} className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-600">
                            + {modifier.name}{Number(modifier.price) ? ` ${money(modifier.price)}` : ""}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.note && <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-2 text-xs text-red-600">หมายเหตุ: {item.note}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 lg:sticky lg:top-6">
          <div>
            <h2 className="font-semibold text-gray-900">รายการชำระเงิน</h2>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4 text-gray-500"><span>ยอดอาหาร</span><span className="font-medium text-gray-700">{money(order.subtotal)}</span></div>
            <div className="flex justify-between gap-4 text-gray-500"><span>ส่วนลด</span><span className="font-medium text-gray-700">{money(order.discount)}</span></div>
            {payment.receivedAmount != null && <div className="flex justify-between gap-4 text-gray-500"><span>รับเงิน</span><span className="font-medium text-gray-700">{money(payment.receivedAmount)}</span></div>}
            {payment.changeAmount != null && <div className="flex justify-between gap-4 text-gray-500"><span>เงินทอน</span><span className="font-medium text-gray-700">{money(payment.changeAmount)}</span></div>}
          </div>
          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="flex items-end justify-between gap-3">
              <span className="font-semibold text-gray-900">รวมสุทธิ</span>
              <span className="text-2xl font-semibold tracking-tight text-blue-600">{money(order.total)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
