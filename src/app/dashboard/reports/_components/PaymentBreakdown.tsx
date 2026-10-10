import type { Report } from "../types";
import { methodText } from "../utils";

export default function PaymentBreakdown({ payments }: { payments: Report["payments"] }) {
  return (
    <div className="flex gap-3 text-xs text-gray-500">
      {payments.map((payment) => <span key={payment.method}>{methodText[payment.method]} ฿{payment.amount.toFixed(2)}</span>)}
    </div>
  );
}
