import type { KeyboardEvent } from "react";
import type { ReportOrder } from "../types";
import { methodText } from "../utils";

type OrdersReportTableProps = {
  rows: ReportOrder[];
  payments: Array<{ method: string; amount: number }>;
  onOpen: (id: number) => void;
};

export default function OrdersReportTable({ rows, payments, onOpen }: OrdersReportTableProps) {
  function openWithKeyboard(event: KeyboardEvent<HTMLElement>, id: number) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpen(id);
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div>
          <h2 className="font-semibold">ประวัติการชำระเงิน</h2>
          <p className="mt-1 text-sm text-gray-400">พบ {rows.length} รายการ</p>
        </div>
        {!!payments.length && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 sm:justify-end">
            {payments.map((payment) => (
              <span key={payment.method} className="whitespace-nowrap">
                {methodText[payment.method] || payment.method} ฿{payment.amount.toFixed(2)}
              </span>
            ))}
          </div>
        )}
      </div>

      {!!rows.length && (
        <div className="space-y-2 border-t border-gray-100 bg-gray-50/70 p-3 md:hidden">
          {rows.map((row) => (
            <article
              key={row.id}
              tabIndex={0}
              role="button"
              aria-label={`ดูรายละเอียด ${row.orderNumber}`}
              className="cursor-pointer rounded-xl border border-gray-100 bg-white p-4 transition active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-200"
              onClick={() => onOpen(row.id)}
              onKeyDown={(event) => openWithKeyboard(event, row.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{row.orderNumber}</p>
                  <p className="mt-1 text-xs text-gray-400">{new Date(row.paidAt).toLocaleString("th-TH")}</p>
                </div>
                <p className="shrink-0 font-semibold text-gray-900">฿{row.total.toFixed(2)}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                <span>โต๊ะ {row.table}</span>
                <span>{methodText[row.method] || row.method}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {!!rows.length && (
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-3 text-left">เลขออเดอร์</th>
                <th className="p-3 text-left">โต๊ะ</th>
                <th className="p-3 text-left">เวลา</th>
                <th className="p-3 text-left">ช่องทาง</th>
                <th className="p-3 text-right">ยอดรวม</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`ดูรายละเอียด ${row.orderNumber}`}
                  className="cursor-pointer border-t border-gray-100 transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  onClick={() => onOpen(row.id)}
                  onKeyDown={(event) => openWithKeyboard(event, row.id)}
                >
                  <td className="p-3 font-medium text-gray-900">{row.orderNumber}</td>
                  <td className="p-3">{row.table}</td>
                  <td className="p-3 text-gray-500">{new Date(row.paidAt).toLocaleString("th-TH")}</td>
                  <td className="p-3">{methodText[row.method] || row.method}</td>
                  <td className="p-3 text-right font-medium">฿{row.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!rows.length && <p className="border-t border-gray-100 px-4 py-8 text-center text-sm text-gray-400">ยังไม่มีประวัติการชำระเงิน</p>}
    </section>
  );
}
