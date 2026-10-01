import type { LucideIcon } from "lucide-react";

export default function StatusPill({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div className="rounded-xl border border-gray-100 px-3 py-2"><div className="flex items-center gap-2"><Icon size={16} className="text-blue-600" /><span className="text-xs text-gray-400">{label}</span></div><p className="mt-1 font-semibold text-gray-900">{value}</p></div>;
}
