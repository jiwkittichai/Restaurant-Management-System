import type { RestaurantBrand } from "@/lib/restaurant-brand";
import { methodText, receiptDateTime, receiptMoney } from "./formatters";
import type { BillOrder, PaymentMethod } from "./types";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] || char));
}

export function buildReceiptHtml(args: { brand: RestaurantBrand; order: BillOrder; method: PaymentMethod; subtotal: number; discount: number; received: number; change: number }) {
  const printedAt = new Date();
  const placeLabel = args.order.tableName ? "Table" : "Queue";
  const placeValue = args.order.tableName || args.order.queueNumber || "-";
  const items = args.order.items.map(item => `
    <div class="item">
      <div class="item-row"><b>${item.qty}</b><span>${escapeHtml(item.name)}</span><b>${receiptMoney(item.price * item.qty)}</b></div>
      ${item.modifiers?.length ? `<div class="item-sub">${item.modifiers.map(modifier => `+ ${escapeHtml(modifier.name)}`).join(", ")}</div>` : ""}
      <div class="item-sub">@ ${receiptMoney(item.price)}</div>
      ${item.note ? `<p>หมายเหตุ: ${escapeHtml(item.note)}</p>` : ""}
    </div>`).join("");

  return `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(args.order.orderNumber)}</title><style>
    @page { size: 80mm 297mm; margin: 0; } * { box-sizing: border-box; } html, body { margin: 0; padding: 0; width: 80mm; background: #fff; color: #000; }
    body { font-family: Arial, sans-serif; font-size: 10.5px; line-height: 1.28; } .receipt { width: 80mm; padding: 3.5mm; } .center { text-align: center; }
    h1 { margin: 0; font-size: 12px; font-weight: 700; } p { margin: 1px 0 0; } .rule { margin: 6px 0; border-top: 1px dashed #000; }
    .meta { display: grid; gap: 2px; } .meta div, .totals div { display: flex; justify-content: space-between; gap: 8px; }
    .head, .item-row { display: grid; grid-template-columns: 8mm 1fr 18mm; gap: 2mm; align-items: start; } .head { margin-bottom: 4px; font-size: 9px; font-weight: 700; }
    .head span:last-child, .item-row b:last-child { text-align: right; } .items { display: grid; gap: 5px; } .item-row { font-weight: 600; }
    .item-sub { padding-left: 10mm; font-size: 9px; } .item p { margin: 2px 0 0 10mm; font-size: 9px; } .totals { display: grid; gap: 3px; }
    .grand { margin-top: 3px; padding-top: 4px; border-top: 1px solid #000; font-size: 14px; font-weight: 700; } .footer { margin-top: 8px; font-size: 9px; text-align: center; }
  </style></head><body><main class="receipt"><div class="center">
    ${args.brand.logoUrl ? `<img src="${escapeHtml(new URL(args.brand.logoUrl, window.location.origin).href)}" alt="โลโก้ร้าน" style="width:18mm;height:18mm;object-fit:contain"/>` : ""}
    <h1>${escapeHtml(args.brand.name)}</h1>${args.brand.address ? `<p style="white-space:pre-wrap">${escapeHtml(args.brand.address)}</p>` : ""}<p>ใบเสร็จรับเงิน / RECEIPT</p>${args.brand.phone ? `<p>โทร. ${escapeHtml(args.brand.phone)}</p>` : ""}
    </div><div class="rule"></div><div class="meta"><div><span>Bill No.</span><b>${escapeHtml(args.order.orderNumber)}</b></div><div><span>Date</span><b>${receiptDateTime(printedAt)}</b></div><div><span>${placeLabel}</span><b>${escapeHtml(placeValue)}</b></div><div><span>Cashier</span><b>เจ้าของร้าน</b></div></div>
    <div class="rule"></div><div class="head"><span>Qty</span><span>Description</span><span>Total</span></div><div class="items">${items}</div><div class="rule"></div>
    <div class="totals"><div><span>Subtotal</span><b>${receiptMoney(args.subtotal)}</b></div><div><span>Discount</span><b>${receiptMoney(args.discount)}</b></div><div class="grand"><span>TOTAL</span><b>${receiptMoney(args.order.total)}</b></div><div><span>Payment</span><b>${methodText[args.method]}</b></div><div><span>Received</span><b>${receiptMoney(args.received)}</b></div><div><span>Change</span><b>${receiptMoney(args.change)}</b></div></div>
    <div class="rule"></div><div class="footer"><p style="white-space:pre-wrap">${escapeHtml(args.brand.receiptFooter || "ขอบคุณที่ใช้บริการ")}</p><p>กรุณาตรวจสอบรายการก่อนออกจากร้าน</p></div>
  </main><script>window.addEventListener("load", () => { window.print(); window.setTimeout(() => window.close(), 500); });</script></body></html>`;
}
