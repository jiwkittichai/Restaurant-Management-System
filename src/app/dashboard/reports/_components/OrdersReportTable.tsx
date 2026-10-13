/**
 * OrdersReportTable แสดงข้อมูลแบบตารางในส่วนรายงานยอดขายและออเดอร์
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import type { KeyboardEvent } from "react";
import type { ReportOrder } from "../types";
import { methodText } from "../utils";
import CopyOrderNumber from "../../_components/CopyOrderNumber";
import { Search, X } from "lucide-react";

type OrdersReportTableProps = {
  rows: ReportOrder[];
  payments: Array<{ method: string; amount: number }>;
  onOpen: (id: number) => void;
  query: string;
  onQuery: (query: string) => void;
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPage: (page: number) => void;
};

export default function OrdersReportTable({ rows, payments, onOpen, query, onQuery, total, page, pageSize, loading, onPage }: OrdersReportTableProps) {
  const rangeStart = rows.length > 0 ? (page - 1) * pageSize + 1 : 0;
  const rangeEnd = rows.length > 0 ? rangeStart + rows.length - 1 : 0;
  const rangeText = rows.length > 0
    ? `รายการ ${rangeStart.toLocaleString("th-TH")}–${rangeEnd.toLocaleString("th-TH")} จาก ${total.toLocaleString("th-TH")}`
    : "0 รายการ";
  const showPagination = !loading && (page > 1 || total > pageSize);

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
          <p className="mt-1 text-sm text-gray-500" role="status">{loading ? "กำลังโหลดรายการ…" : rangeText}</p>
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

      <div className="px-4 pb-4 sm:px-5">
        <div className="relative w-full sm:max-w-xl">
          <label htmlFor="report-order-search" className="sr-only">ค้นหาเลขออเดอร์หรือคิว</label>
          <Search aria-hidden="true" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            id="report-order-search"
            type="search"
            value={query}
            maxLength={100}
            onChange={event => onQuery(event.target.value)}
            placeholder="ค้นหาเลขออเดอร์หรือคิว"
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-11 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              aria-label="ล้างคำค้นหา"
              title="ล้างคำค้นหา"
              onClick={() => onQuery("")}
              className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-blue-500"
            >
              <X aria-hidden="true" size={16} />
            </button>
          )}
        </div>
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
                  <div className="flex items-center gap-1"><span className="break-all font-medium text-gray-900">{row.orderNumber}</span><CopyOrderNumber value={row.orderNumber} /></div>
                  <p className="mt-1 text-xs text-gray-400">{new Date(row.paidAt).toLocaleString("th-TH")}</p>
                </div>
                <p className="shrink-0 font-semibold text-gray-900">฿{row.total.toFixed(2)}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                <span>{row.type === "TAKEAWAY" ? `กลับบ้าน${row.queueNumber ? ` · คิว ${row.queueNumber}` : ""}` : row.table}</span>
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
                <th className="p-3 text-left">โต๊ะ / คิว</th>
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
                  <td className="p-3 font-medium text-gray-900">{row.orderNumber}<CopyOrderNumber value={row.orderNumber} /></td>
                  <td className="p-3">{row.type === "TAKEAWAY" ? `กลับบ้าน${row.queueNumber ? ` · ${row.queueNumber}` : ""}` : row.table}</td>
                  <td className="p-3 text-gray-500">{new Date(row.paidAt).toLocaleString("th-TH")}</td>
                  <td className="p-3">{methodText[row.method] || row.method}</td>
                  <td className="p-3 text-right font-medium">฿{row.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!rows.length && <p className="border-t border-gray-100 px-4 py-8 text-center text-sm text-gray-500">{query ? "ไม่พบเลขออเดอร์หรือคิวในช่วงวันที่ที่เลือก" : "ยังไม่มีประวัติการชำระเงิน"}</p>}
      {showPagination && <div className="flex items-center justify-between gap-3 border-t border-gray-100 p-4 text-sm">
        <button type="button" disabled={loading || page <= 1} onClick={() => onPage(page - 1)} className="rounded-xl border border-gray-200 px-4 py-2 disabled:opacity-40">ก่อนหน้า</button>
        <span className="text-center">{rangeText}</span>
        <button type="button" disabled={loading || page * pageSize >= total} onClick={() => onPage(page + 1)} className="rounded-xl border border-gray-200 px-4 py-2 disabled:opacity-40">ถัดไป</button>
      </div>}
    </section>
  );
}
