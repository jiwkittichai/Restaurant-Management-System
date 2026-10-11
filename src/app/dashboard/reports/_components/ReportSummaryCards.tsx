import { Banknote, ClipboardList, Percent, ReceiptText } from "lucide-react";
import type { Report } from "../types";
import { money } from "../utils";

export default function ReportSummaryCards({ summary }: { summary: Report["summary"] }) {
  const cards = [
    { label: "ยอดขาย", value: money(summary.sales), icon: Banknote, color: "text-emerald-600 bg-emerald-50" },
    { label: "จำนวนบิล", value: summary.orders, icon: ReceiptText, color: "text-blue-600 bg-blue-50" },
    { label: "ยอดเฉลี่ยต่อบิล", value: money(summary.average), icon: ClipboardList, color: "text-violet-600 bg-violet-50" },
    { label: "ส่วนลดรวม", value: money(summary.discounts), icon: Percent, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="flex min-w-0 items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:gap-4 sm:p-5">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-11 sm:w-11 ${color}`}><Icon size={21} /></div>
          <div className="min-w-0"><p className="text-xs text-gray-400 sm:text-sm">{label}</p><p className="truncate text-lg font-semibold sm:text-xl">{value}</p></div>
        </div>
      ))}
    </div>
  );
}
