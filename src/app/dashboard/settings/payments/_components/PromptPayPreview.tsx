import { QrCode } from "lucide-react";
import type { PaymentSettings } from "../types";

export default function PromptPayPreview({ settings }: { settings: PaymentSettings }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <p className="mb-3 text-sm font-semibold text-gray-900">ตัวอย่างที่จะแสดงตอนเช็คบิล</p>
      <div className="grid min-h-64 place-items-center rounded-xl bg-white p-3">
        {settings.promptPayQrImageUrl ? (
          <img src={settings.promptPayQrImageUrl} alt="QR พร้อมเพย์" className="max-h-56 max-w-full object-contain" />
        ) : (
          <QrCode size={72} className="text-gray-200" />
        )}
      </div>
      <p className="mt-3 truncate text-sm font-semibold text-gray-900">{settings.promptPayAccountName || "ชื่อบัญชีรับเงิน"}</p>
      <p className="text-xs text-gray-400">{settings.promptPayIdentifier || "เลขบัญชี / เบอร์พร้อมเพย์"}</p>
    </div>
  );
}
