/**
 * LoadErrorMessage แสดงข้อความเมื่อโหลดข้อมูลไม่สำเร็จพร้อมปุ่มลองใหม่
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import { RefreshCw } from "lucide-react";

type Props = {
  message: string;
  onRetry: () => void;
};

export default function LoadErrorMessage({ message, onRetry }: Props) {
  if (!message) return null;

  return (
    <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
      <span>{message}</span>
      <button type="button" onClick={onRetry} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 font-medium text-red-600 shadow-sm transition hover:bg-red-100">
        <RefreshCw size={15} />
        ลองใหม่
      </button>
    </div>
  );
}
