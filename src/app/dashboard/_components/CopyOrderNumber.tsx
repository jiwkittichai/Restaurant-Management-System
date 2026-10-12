"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyOrderNumber({ value }: { value: string }) {
  const [message, setMessage] = useState("");
  return <span className="inline-flex shrink-0 items-center gap-1 align-middle">
    <button type="button" aria-label={`คัดลอกเลขออเดอร์ ${value}`} title="คัดลอกเลขออเดอร์"
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-blue-500"
      onKeyDown={event => event.stopPropagation()}
      onClick={async event => {
        event.stopPropagation();
        try { await navigator.clipboard.writeText(value); setMessage("คัดลอกแล้ว"); }
        catch { setMessage("คัดลอกไม่สำเร็จ กรุณาเลือกข้อความเพื่อคัดลอก"); }
      }}>
      {message === "คัดลอกแล้ว" ? <Check size={16} /> : <Copy size={16} />}
    </button>
    <span role="status" className="sr-only">{message}</span>
  </span>;
}
