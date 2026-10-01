"use client";

import { Printer, ReceiptText, WalletCards, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { RestaurantBrand } from "@/lib/restaurant-brand";
import { itemStatusText, methodText, money } from "./formatters";
import { buildReceiptHtml } from "./receipt";
import type { BillModalProps, BillOrder, PaymentMethod, PromptPaySettings } from "./types";
import PrintableReceipt from "./PrintableReceipt";

export type { BillOrder, PromptPaySettings } from "./types";

export default function BillModal({ order, title = "เช็คบิล", loading = false, onClose, onConfirm, promptPaySettings }: BillModalProps) {
  const [brand, setBrand] = useState<RestaurantBrand | null>(null);
  const [brandError, setBrandError] = useState("");
  useEffect(() => {
    if (!order) return;
    let stopped = false;
    setBrand(null); setBrandError("");
    fetch("/api/restaurant-profile").then(async res => { if (!res.ok) throw new Error(); const data = await res.json(); if (!stopped) setBrand(data); }).catch(() => { if (!stopped) setBrandError("โหลดข้อมูลร้านไม่สำเร็จ กรุณาปิดแล้วเปิดบิลใหม่ก่อนพิมพ์"); });
    return () => { stopped = true; };
  }, [order?.id]);

  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [received, setReceived] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!order) return;
    setMethod("CASH");
    setReceived(order.total.toFixed(2));
    setError("");
  }, [order]);

  const receivedAmount = Number(received || 0);
  const changeAmount = useMemo(() => Math.max(0, receivedAmount - (order?.total || 0)), [order?.total, receivedAmount]);
  const itemSubtotal = order?.items.reduce((sum, item) => sum + item.price * item.qty, 0) || 0;
  const subtotal = order?.subtotal ?? itemSubtotal;
  const discount = order?.discount ?? Math.max(0, subtotal - (order?.total || 0));
  const printableReceived = method === "CASH" ? receivedAmount : order?.total || 0;
  const printableChange = method === "CASH" ? changeAmount : 0;
  const now = new Date();
  const promptPayEnabled = Boolean(promptPaySettings?.promptPayEnabled);
  const paymentOptions = (promptPayEnabled ? Object.keys(methodText) : ["CASH"]) as PaymentMethod[];

  if (!order) return null;

  async function submit() {
    if (!order) return;
    const finalReceived = method === "CASH" ? receivedAmount : order.total;
    if (method === "CASH" && finalReceived < order.total) {
      setError("ยอดรับเงินต้องไม่น้อยกว่ายอดสุทธิ");
      return;
    }
    setError("");
    try {
      await onConfirm({
        orderId: order.id,
        method,
        receivedAmount: finalReceived,
        changeAmount: method === "CASH" ? Math.max(0, finalReceived - order.total) : 0,
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "รับชำระเงินไม่สำเร็จ");
    }
  }

  function printReceipt() {
    if (!brand) return;
    if (!order) return;
    const printWindow = window.open("", "_blank", "width=360,height=640");
    if (!printWindow) {
      setError("เบราว์เซอร์บล็อกหน้าต่างพิมพ์ กรุณาอนุญาต pop-up");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(buildReceiptHtml({
      brand,
      order,
      method,
      subtotal,
      discount,
      received: printableReceived,
      change: printableChange,
    }));
    printWindow.document.close();
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/35 p-4 grid place-items-center print:hidden">
        <div className="w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 grid place-items-center">
              <ReceiptText size={21} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-400">{order.orderNumber}{order.tableName ? ` · ${order.tableName}` : order.queueNumber ? ` · ${order.queueNumber}` : ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100" aria-label="ปิดบิล">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <section id="bill-print-area" className="space-y-4">
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="grid grid-cols-[1fr_64px_96px] bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500">
                <span>รายการ</span>
                <span className="text-center">จำนวน</span>
                <span className="text-right">รวม</span>
              </div>
              {order.items.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_64px_96px] border-t border-gray-100 px-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-gray-800">{item.name}</p>
                      {item.status && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">{itemStatusText[item.status] || item.status}</span>}
                    </div>
                    <p className="text-xs text-gray-400">{money(item.price)} / หน่วย</p>
                    {!!item.modifiers?.length && (
                      <p className="mt-1 text-xs text-blue-600">
                        {item.modifiers.map((modifier) => `+ ${modifier.name}`).join(", ")}
                      </p>
                    )}
                    {item.note && <p className="mt-1 text-xs text-red-500">หมายเหตุ: {item.note}</p>}
                  </div>
                  <span className="text-center text-gray-600">{item.qty}</span>
                  <span className="text-right font-medium">{money(item.price * item.qty)}</span>
                </div>
              ))}
            </div>

            <div className="ml-auto w-full sm:w-80 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500"><span>ยอดอาหาร</span><span>{money(subtotal)}</span></div>
              <div className="flex justify-between text-gray-500"><span>ส่วนลด</span><span>{money(discount)}</span></div>
              <div className="flex justify-between border-t border-gray-100 pt-2 text-lg font-semibold text-gray-900"><span>ยอดสุทธิ</span><span className="text-blue-600">{money(order.total)}</span></div>
            </div>
          </section>

          <div className="mt-5 rounded-xl border border-gray-100 p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700"><WalletCards size={17} /> วิธีชำระเงิน</p>
            <div className="grid grid-cols-2 gap-2">
              {paymentOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setMethod(option);
                    if (option !== "CASH") setReceived(order.total.toFixed(2));
                    if (option === "CASH") {
                    }
                  }}
                  className={`rounded-xl py-2.5 text-sm ${method === option ? "bg-[#356DDB] text-white" : "bg-gray-100 text-gray-500"}`}
                >
                  {methodText[option]}
                </button>
              ))}
            </div>

            {method === "CASH" && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-gray-500">
                  ยอดรับเงิน
                  <input
                    type="number"
                    min={order.total}
                    step="0.01"
                    value={received}
                    onChange={(event) => setReceived(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-gray-900 outline-none"
                  />
                </label>
                <div className="rounded-xl bg-emerald-50 px-4 py-3">
                  <p className="text-xs text-emerald-700">เงินทอน</p>
                  <p className="text-xl font-semibold text-emerald-700">{money(changeAmount)}</p>
                </div>
              </div>
            )}
            {method === "PROMPTPAY" && promptPayEnabled && (
              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">สแกนจ่ายพร้อมเพย์</p>
                    <p className="mt-1 text-xs text-gray-600">ยอดชำระ {money(order.total)}</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-600">QR ร้าน</span>
                </div>
                {promptPaySettings?.promptPayQrImageUrl ? (
                  <div className="mt-4 grid place-items-center">
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <img src={promptPaySettings.promptPayQrImageUrl} alt="QR พร้อมเพย์" className="h-64 w-64 object-contain sm:h-72 sm:w-72" />
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 rounded-xl bg-white px-3 py-2 text-xs font-medium text-amber-700">ยังไม่ได้อัปโหลดรูป QR พร้อมเพย์</p>
                )}
                <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm">
                  <div className="flex justify-between gap-3"><span className="text-gray-400">ชื่อบัญชี</span><span className="text-right font-semibold text-gray-900">{promptPaySettings?.promptPayAccountName || "-"}</span></div>
                  <div className="mt-1 flex justify-between gap-3"><span className="text-gray-400">เลขบัญชี / พร้อมเพย์</span><span className="text-right font-semibold text-gray-900">{promptPaySettings?.promptPayIdentifier || "-"}</span></div>
                </div>
                <p className="mt-3 text-xs text-blue-700">ตรวจสอบสลิปหรือยอดเข้าแอปธนาคารก่อนกดยืนยันรับชำระ</p>
              </div>
            )}
            {method === "PROMPTPAY" && !promptPayEnabled && (
              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
                <p className="text-sm font-semibold text-gray-900">ยังไม่ได้เปิดใช้งานพร้อมเพย์</p>
                <p className="mt-1 text-xs text-gray-500">
                  กรุณาเปิดใช้งานในหน้าตั้งค่าการชำระเงินก่อนรับชำระด้วยพร้อมเพย์
                </p>
                <p className="mt-3 text-lg font-semibold text-blue-600">{money(order.total)}</p>
              </div>
            )}
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 p-4 sm:flex-row sm:justify-end">
          {brandError && <p role="alert" className="text-sm text-red-600">{brandError}</p>}
          <button disabled={!brand} onClick={printReceipt} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 flex items-center justify-center gap-2">
            <Printer size={16} /> พิมพ์บิล
          </button>
          <button onClick={submit} disabled={loading} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
            {loading ? "กำลังดำเนินการ..." : `รับชำระ ${money(order.total)}`}
          </button>
        </div>
        </div>
      </div>

      <PrintableReceipt brand={brand} order={order} method={method} subtotal={subtotal} discount={discount} received={printableReceived} change={printableChange} printedAt={now} />
    </>
  );
}
