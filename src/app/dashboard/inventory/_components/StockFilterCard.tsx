import type { LucideIcon } from "lucide-react";

export default function StockFilterCard({ active, label, value, tone, icon: Icon, iconClass, activeClass, hoverClass, onClick }: { active: boolean; label: string; value: string; tone: string; icon: LucideIcon; iconClass: string; activeClass: string; hoverClass: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-xl border px-3 py-2 text-left transition ${hoverClass} ${active ? activeClass : "border-gray-100 bg-white"}`}><div className="flex items-center gap-2.5"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconClass}`}><Icon size={16} /></span><span className="min-w-0"><span className="block truncate text-xs text-gray-400">{label}</span><span className={`block font-semibold ${tone}`}>{value}</span></span></div></button>;
}
