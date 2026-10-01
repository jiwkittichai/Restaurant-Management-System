import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Banknote, Clock3, ReceiptText, Utensils } from "lucide-react";
import { StaffRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export default async function ReportOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const tableName = order.table?.name || "ซื้อกลับบ้าน";
  const payment = order.payment;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <Link
        href="/dashboard/reports"
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
      >
        <ArrowLeft size={17} />
        กลับหน้ารายงานยอดขาย
      </Link>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <ReceiptText size={22} />
            </span>
            <div className="min-w-0">
              <h2 className="font-semibold text-gray-900">รายละเอียดบิลออเดอร์</h2>
              <p className="mt-1 break-words text-sm text-gray-500">{order.orderNumber} · {tableName}</p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600">ชำระเงินแล้ว</span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
            <Utensils size={18} className="shrink-0 text-gray-400" />
            <div><p className="text-xs text-gray-400">ประเภทออเดอร์</p><p className="mt-1 text-sm font-medium text-gray-900">{orderTypeText[order.type] || order.type}</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
            <Banknote size={18} className="shrink-0 text-gray-400" />
            <div><p className="text-xs text-gray-400">ช่องทางชำระเงิน</p><p className="mt-1 text-sm font-medium text-gray-900">{methodText[payment.method] || payment.method}</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
            <Clock3 size={18} className="shrink-0 text-gray-400" />
            <div><p className="text-xs text-gray-400">เวลาชำระเงิน</p><p className="mt-1 text-sm font-medium text-gray-900">{dateTime(payment.paidAt)}</p></div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-xs text-gray-400">หมายเหตุ</p>
            <p className="mt-1 break-words text-sm font-medium text-gray-900">{order.note || "-"}</p>
          </div>
        </div>

        {(order.customerName || order.customerPhone) && (
          <div className="mt-3 rounded-xl border border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-400">ข้อมูลลูกค้า</p>
            {order.customerName && <p className="mt-1 font-medium text-gray-900">{order.customerName}</p>}
            {order.customerPhone && <p className="text-sm text-gray-500">{order.customerPhone}</p>}
          </div>
        )}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-900">รายการอาหาร</h2>
            <p className="mt-1 text-sm text-gray-400">ทั้งหมด {order.items.reduce((sum, item) => sum + item.qty, 0).toLocaleString("th-TH")} รายการ</p>
          </div>
          <div className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <div key={item.id} className="px-5 py-4">
                <div className="grid grid-cols-[48px_1fr_auto] gap-3 text-sm">
                  <p className="font-semibold text-blue-600">{item.qty}x</p>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="mt-1 text-xs text-gray-400">{money(item.price)} / {item.menuItem.saleUnit || "หน่วย"}</p>
                    {!!item.modifiers.length && (
                      <p className="mt-1 text-xs text-blue-600">
                        {item.modifiers.map((modifier) => `+ ${modifier.name}${Number(modifier.price) ? ` ${money(modifier.price)}` : ""}`).join(", ")}
                      </p>
                    )}
                    {item.note && <p className="mt-2 text-xs text-red-500">หมายเหตุ: {item.note}</p>}
                  </div>
                  <p className="whitespace-nowrap font-semibold text-gray-900">{money(Number(item.price) * item.qty)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="font-semibold text-gray-900">สรุปการชำระเงิน</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between text-gray-500"><span>ยอดอาหาร</span><span>{money(order.subtotal)}</span></div>
            <div className="flex justify-between text-gray-500"><span>ส่วนลด</span><span>{money(order.discount)}</span></div>
            {payment.receivedAmount != null && <div className="flex justify-between text-gray-500"><span>รับเงิน</span><span>{money(payment.receivedAmount)}</span></div>}
            {payment.changeAmount != null && <div className="flex justify-between text-gray-500"><span>เงินทอน</span><span>{money(payment.changeAmount)}</span></div>}
            <div className="flex justify-between border-t border-gray-100 pt-4 text-base font-semibold text-gray-900">
              <span>รวมสุทธิ</span>
              <span className="text-blue-600">{money(order.total)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
