"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

export default function PlatformBrand({ fallbackIcon }: { fallbackIcon: ReactNode }) {
  const [name, setName] = useState("Restaurant Management System");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  useEffect(() => { const controller = new AbortController(); fetch("/api/platform-info", { signal: controller.signal }).then(r => r.ok ? r.json() : null).then(data => { if (data?.name) setName(data.name); setLogoUrl(typeof data?.logoUrl === "string" ? data.logoUrl : null); }).catch(() => {}); return () => controller.abort(); }, []);
  return <>
    <div className={`mx-auto mb-5 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl ${logoUrl ? "bg-white" : "bg-blue-50 text-blue-600"}`}>
      {logoUrl ? <img src={logoUrl} alt={`โลโก้ ${name}`} className="h-full w-full object-contain" /> : fallbackIcon}
    </div>
    <p className="text-sm text-gray-400">{name}</p>
  </>;
}
