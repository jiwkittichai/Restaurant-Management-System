import type { KeyboardEvent } from "react";
import type { ReportOrder } from "../types";
import { methodText } from "../utils";
import PaymentBreakdown from "./PaymentBreakdown";

type OrdersReportTableProps = {
  rows: ReportOrder[];
  payments: Array<{ method: string; amount: number }>;
  onOpen: (id: number) => void;
};

export default function OrdersReportTable({ rows, payments, onOpen }: OrdersReportTableProps) {
  function openWithKeyboard(event: KeyboardEvent<HTMLTableRowElement>, id: number) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpen(id);
  }

  return (
    <section className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div><h2 className="font-semibold">ประวัติการชำระเงิน</h2><p className="mt-1 text-sm text-gray-400">พบ {rows.length} รายการ</p></div>
        <PaymentBreakdown payments={payments} />
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500"><tr><th className="p-3 text-left">เลขออเดอร์</th><th className="p-3 text-left">โต๊ะ</th><th className="p-3 text-left">เวลา</th><th className="p-3 text-left">ช่องทาง</th><th className="p-3 text-right">ยอดรวม</th></tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} tabIndex={0} role="button" aria-label={`ดูรายละเอียด ${row.orderNumber}`} className="cursor-pointer border-t border-gray-100 transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-none" onClick={() => onOpen(row.id)} onKeyDown={(event) => openWithKeyboard(event, row.id)}>
              <td className="p-3 font-medium text-gray-900">{row.orderNumber}</td><td className="p-3">{row.table}</td><td className="p-3 text-gray-500">{new Date(row.paidAt).toLocaleString("th-TH")}</td><td className="p-3">{methodText[row.method] || row.method}</td><td className="p-3 text-right font-medium">฿{row.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="py-8 text-center text-gray-400">ยังไม่มีประวัติการชำระเงิน</p>}
    </section>
  );
}
