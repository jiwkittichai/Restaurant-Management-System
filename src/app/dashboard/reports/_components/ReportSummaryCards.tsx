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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5">
          <div className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}><Icon size={21} /></div>
          <div><p className="text-sm text-gray-400">{label}</p><p className="text-xl font-semibold">{value}</p></div>
        </div>
      ))}
    </div>
  );
}
