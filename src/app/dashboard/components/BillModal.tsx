"use client";

import { CheckCircle2, Printer, RefreshCw, ReceiptText, WalletCards, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PaymentMethod = "CASH" | "PROMPTPAY";

export type BillOrder = {
  id: number;
  orderNumber: string;
  subtotal?: number;
  discount?: number;
  total: number;
  tableName?: string;
  queueNumber?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt?: string;
  items: Array<{ id: number; name: string; qty: number; price: number; note?: string | null; status?: string }>;
};

type BillModalProps = {
  order: BillOrder | null;
  title?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (payload: { orderId: number; method: PaymentMethod; receivedAmount: number; changeAmount: number }) => Promise<void>;
  onStripePromptPay?: (orderId: number) => Promise<PromptPayQrPayment>;
  onStripePromptPayStatus?: (paymentIntentId: string) => Promise<{ paid: boolean; status: string }>;
};

type PromptPayQrPayment = {
  paymentIntentId: string;
  status: string;
  qrCodeImageUrl: string;
};

const methodText: Record<PaymentMethod, string> = {
  CASH: "เงินสด",
  PROMPTPAY: "พร้อมเพย์",
};

const itemStatusText: Record<string, string> = {
  NEW: "รอครัวรับ",
  PREPARING: "กำลังทำ",
  READY: "พร้อมแล้ว",
  SERVED: "เสิร์ฟแล้ว",
};

function money(value: number) {
  return `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function receiptMoney(value: number) {
  return value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function receiptDateTime(date: Date) {
  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));
}

function buildReceiptHtml(args: {
  order: BillOrder;
  method: PaymentMethod;
  subtotal: number;
  discount: number;
  received: number;
  change: number;
}) {
  const printedAt = new Date();
  const placeLabel = args.order.tableName ? "Table" : "Queue";
  const placeValue = args.order.tableName || args.order.queueNumber || "-";
  const items = args.order.items.map((item) => `
    <div class="item">
      <div class="item-row">
        <b>${item.qty}</b>
        <span>${escapeHtml(item.name)}</span>
        <b>${receiptMoney(item.price * item.qty)}</b>
      </div>
      <div class="item-sub">@ ${receiptMoney(item.price)}</div>
      ${item.note ? `<p>หมายเหตุ: ${escapeHtml(item.note)}</p>` : ""}
    </div>
  `).join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(args.order.orderNumber)}</title>
  <style>
    @page { size: 80mm 297mm; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 80mm; background: #fff; color: #000; }
    body { font-family: Arial, sans-serif; font-size: 10.5px; line-height: 1.28; }
    .receipt { width: 80mm; padding: 3.5mm; }
    .center { text-align: center; }
    .logo { display: inline-flex; align-items: center; justify-content: center; width: 20mm; height: 8mm; margin-bottom: 2mm; border: 1px solid #000; font-size: 15px; font-weight: 700; }
    h1 { margin: 0; font-size: 12px; font-weight: 700; }
    p { margin: 1px 0 0; }
    .rule { margin: 6px 0; border-top: 1px dashed #000; }
    .meta { display: grid; gap: 2px; }
    .meta div, .totals div { display: flex; justify-content: space-between; gap: 8px; }
    .head, .item-row { display: grid; grid-template-columns: 8mm 1fr 18mm; gap: 2mm; align-items: start; }
    .head { margin-bottom: 4px; font-size: 9px; font-weight: 700; }
    .head span:last-child, .item-row b:last-child { text-align: right; }
    .items { display: grid; gap: 5px; }
    .item-row { font-weight: 600; }
    .item-sub { padding-left: 10mm; font-size: 9px; }
    .item p { margin: 2px 0 0 10mm; font-size: 9px; }
    .totals { display: grid; gap: 3px; }
    .grand { margin-top: 3px; padding-top: 4px; border-top: 1px solid #000; font-size: 14px; font-weight: 700; }
    .footer { margin-top: 8px; font-size: 9px; text-align: center; }
  </style>
</head>
<body>
  <main class="receipt">
    <div class="center">
      <div class="logo">RMS</div>
      <h1>RESTAURANT MANAGEMENT SYSTEM</h1>
      <p>ใบเสร็จรับเงิน / RECEIPT</p>
      <p>โทร. 089-000-0000</p>
    </div>
    <div class="rule"></div>
    <div class="meta">
      <div><span>Bill No.</span><b>${escapeHtml(args.order.orderNumber)}</b></div>
      <div><span>Date</span><b>${receiptDateTime(printedAt)}</b></div>
      <div><span>${placeLabel}</span><b>${escapeHtml(placeValue)}</b></div>
      <div><span>Cashier</span><b>เจ้าของร้าน</b></div>
    </div>
    <div class="rule"></div>
    <div class="head"><span>Qty</span><span>Description</span><span>Total</span></div>
    <div class="items">${items}</div>
    <div class="rule"></div>
    <div class="totals">
      <div><span>Subtotal</span><b>${receiptMoney(args.subtotal)}</b></div>
      <div><span>Discount</span><b>${receiptMoney(args.discount)}</b></div>
      <div class="grand"><span>TOTAL</span><b>${receiptMoney(args.order.total)}</b></div>
      <div><span>Payment</span><b>${methodText[args.method]}</b></div>
      <div><span>Received</span><b>${receiptMoney(args.received)}</b></div>
      <div><span>Change</span><b>${receiptMoney(args.change)}</b></div>
    </div>
    <div class="rule"></div>
    <div class="footer">
      <p>*** ขอบคุณที่ใช้บริการ ***</p>
      <p>กรุณาตรวจสอบรายการก่อนออกจากร้าน</p>
    </div>
  </main>
  <script>
    window.addEventListener("load", () => {
      window.print();
      window.setTimeout(() => window.close(), 500);
    });
  </script>
</body>
</html>`;
}

export default function BillModal({ order, title = "เช็คบิล", loading = false, onClose, onConfirm, onStripePromptPay, onStripePromptPayStatus }: BillModalProps) {
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [received, setReceived] = useState("");
  const [error, setError] = useState("");
  const [stripeLoading, setStripeLoading] = useState(false);
  const [promptPayQr, setPromptPayQr] = useState<PromptPayQrPayment | null>(null);
  const [promptPayStatus, setPromptPayStatus] = useState("");
  const [promptPayPaid, setPromptPayPaid] = useState(false);

  useEffect(() => {
    if (!order) return;
    setMethod("CASH");
    setReceived(order.total.toFixed(2));
    setError("");
    setStripeLoading(false);
    setPromptPayQr(null);
    setPromptPayStatus("");
    setPromptPayPaid(false);
  }, [order]);

  const receivedAmount = Number(received || 0);
  const changeAmount = useMemo(() => Math.max(0, receivedAmount - (order?.total || 0)), [order?.total, receivedAmount]);
  const itemSubtotal = order?.items.reduce((sum, item) => sum + item.price * item.qty, 0) || 0;
  const subtotal = order?.subtotal ?? itemSubtotal;
  const discount = order?.discount ?? Math.max(0, subtotal - (order?.total || 0));
  const printableReceived = method === "CASH" ? receivedAmount : order?.total || 0;
  const printableChange = method === "CASH" ? changeAmount : 0;
  const now = new Date();

  useEffect(() => {
    if (!promptPayQr || !onStripePromptPayStatus || promptPayPaid) return;
    const timer = window.setInterval(() => {
      checkPromptPayStatus({ silent: true });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [promptPayQr?.paymentIntentId, onStripePromptPayStatus, promptPayPaid]);

  if (!order) return null;

  async function submit() {
    if (!order) return;
    if (promptPayPaid) {
      onClose();
      return;
    }
    if (method === "PROMPTPAY" && onStripePromptPay) {
      if (promptPayQr) await checkPromptPayStatus();
      else await createPromptPayQr();
      return;
    }
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

  async function createPromptPayQr() {
    if (!order || !onStripePromptPay) return;
    setError("");
    setStripeLoading(true);
    try {
      const payment = await onStripePromptPay(order.id);
      setPromptPayQr(payment);
      setPromptPayStatus(payment.status);
    } catch (error) {
      setError(error instanceof Error ? error.message : "สร้าง QR ไม่สำเร็จ");
    } finally {
      setStripeLoading(false);
    }
  }

  async function checkPromptPayStatus(options?: { silent?: boolean }) {
    if (!promptPayQr || !onStripePromptPayStatus) return;
    if (!options?.silent) {
      setError("");
      setStripeLoading(true);
    }
    try {
      const result = await onStripePromptPayStatus(promptPayQr.paymentIntentId);
      setPromptPayStatus(result.status);
      if (result.paid) {
        setError("");
        setPromptPayPaid(true);
        setPromptPayStatus("succeeded");
      } else if (!options?.silent) {
        setError("ยังไม่พบยอดชำระ กรุณาลองตรวจสอบอีกครั้ง");
      }
    } catch (error) {
      if (!options?.silent) setError(error instanceof Error ? error.message : "ตรวจสอบการชำระเงินไม่สำเร็จ");
    } finally {
      if (!options?.silent) setStripeLoading(false);
    }
  }

  function printReceipt() {
    if (!order) return;
    const printWindow = window.open("", "_blank", "width=360,height=640");
    if (!printWindow) {
      setError("เบราว์เซอร์บล็อกหน้าต่างพิมพ์ กรุณาอนุญาต pop-up");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(buildReceiptHtml({
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
              {(Object.keys(methodText) as PaymentMethod[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setMethod(option);
                    if (option !== "CASH") setReceived(order.total.toFixed(2));
                    if (option === "CASH") {
                      setPromptPayQr(null);
                      setPromptPayStatus("");
                      setPromptPayPaid(false);
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
            {method === "PROMPTPAY" && onStripePromptPay && (
              <div className={`mt-4 rounded-xl border px-4 py-4 ${promptPayPaid ? "border-emerald-100 bg-emerald-50" : "border-gray-100 bg-gray-50"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-sm font-semibold ${promptPayPaid ? "text-emerald-700" : "text-gray-900"}`}>
                      {promptPayPaid ? "ชำระเงินสำเร็จแล้ว" : "สแกนจ่ายพร้อมเพย์"}
                    </p>
                    <p className={`mt-1 text-xs ${promptPayPaid ? "text-emerald-700" : "text-gray-500"}`}>
                      ยอดชำระ {money(order.total)}
                    </p>
                  </div>
                  {promptPayQr && !promptPayPaid && (
                    <button type="button" onClick={() => checkPromptPayStatus()} disabled={stripeLoading} className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-blue-600 disabled:opacity-50">
                      <span className="inline-flex items-center gap-1"><RefreshCw size={13} /> ตรวจสอบ</span>
                    </button>
                  )}
                </div>
                {promptPayPaid ? (
                  <div className="mt-3 flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-emerald-700 shadow-sm">
                    <CheckCircle2 size={28} className="shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold">รับชำระเงินเรียบร้อยแล้ว</p>
                    </div>
                  </div>
                ) : promptPayQr ? (
                  <div className="mt-4 grid place-items-center">
                    <div className="rounded-xl bg-white p-4 shadow-sm">
                      <img src={promptPayQr.qrCodeImageUrl} alt="QR พร้อมเพย์" className="h-64 w-64 object-contain sm:h-72 sm:w-72" />
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">กดปุ่มด้านล่างเพื่อสร้าง QR</p>
                )}
              </div>
            )}
            {method === "PROMPTPAY" && !onStripePromptPay && (
              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-4">
                <p className="text-sm font-semibold text-gray-900">บันทึกรับชำระพร้อมเพย์</p>
                <p className="mt-1 text-xs text-gray-500">
                  ยังไม่ได้ตั้งค่า Stripe gateway ระบบจะบันทึกยอดชำระเป็นพร้อมเพย์โดยไม่สร้าง QR
                </p>
                <p className="mt-3 text-lg font-semibold text-blue-600">{money(order.total)}</p>
              </div>
            )}
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 p-4 sm:flex-row sm:justify-end">
          <button onClick={printReceipt} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 flex items-center justify-center gap-2">
            <Printer size={16} /> พิมพ์บิล
          </button>
          <button onClick={submit} disabled={loading || stripeLoading} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50">
            {loading || stripeLoading ? "กำลังดำเนินการ..." : promptPayPaid ? "ปิดหน้าต่าง" : method === "PROMPTPAY" && onStripePromptPay ? (promptPayQr ? "ตรวจสอบการชำระเงิน" : "สร้าง QR") : `รับชำระ ${money(order.total)}`}
          </button>
        </div>
        </div>
      </div>

      <section className="receipt-print hidden">
        <div className="receipt-center">
          <div className="receipt-logo">RMS</div>
          <h1>RESTAURANT MANAGEMENT SYSTEM</h1>
          <p>ใบเสร็จรับเงิน / RECEIPT</p>
          <p>โทร. 089-000-0000</p>
        </div>

        <div className="receipt-rule" />

        <div className="receipt-meta">
          <div><span>Bill No.</span><b>{order.orderNumber}</b></div>
          <div><span>Date</span><b>{receiptDateTime(now)}</b></div>
          <div><span>{order.tableName ? "Table" : "Queue"}</span><b>{order.tableName || order.queueNumber || "-"}</b></div>
          <div><span>Cashier</span><b>เจ้าของร้าน</b></div>
        </div>

        <div className="receipt-rule" />

        <div className="receipt-table-head">
          <span>Qty</span>
          <span>Description</span>
          <span>Total</span>
        </div>

        <div className="receipt-items">
          {order.items.map((item) => (
            <div key={item.id} className="receipt-item">
              <div className="receipt-item-row">
                <b>{item.qty}</b>
                <span>{item.name}</span>
                <b>{receiptMoney(item.price * item.qty)}</b>
              </div>
              <div className="receipt-item-sub">
                <span>@ {receiptMoney(item.price)}</span>
              </div>
              {item.note && <p>หมายเหตุ: {item.note}</p>}
            </div>
          ))}
        </div>

        <div className="receipt-rule" />

        <div className="receipt-totals">
          <div><span>Subtotal</span><b>{receiptMoney(subtotal)}</b></div>
          <div><span>Discount</span><b>{receiptMoney(discount)}</b></div>
          <div className="receipt-grand"><span>TOTAL</span><b>{receiptMoney(order.total)}</b></div>
          <div><span>Payment</span><b>{methodText[method]}</b></div>
          <div><span>Received</span><b>{receiptMoney(printableReceived)}</b></div>
          <div><span>Change</span><b>{receiptMoney(printableChange)}</b></div>
        </div>

        <div className="receipt-rule" />

        <div className="receipt-center receipt-footer">
          <p>*** ขอบคุณที่ใช้บริการ ***</p>
          <p>กรุณาตรวจสอบรายการก่อนออกจากร้าน</p>
        </div>
      </section>
    </>
  );
}
