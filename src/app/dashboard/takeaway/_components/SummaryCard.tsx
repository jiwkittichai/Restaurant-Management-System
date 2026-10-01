export default function SummaryCard({ active, label, value, tone = "text-gray-900", activeClass, hoverClass, onClick }: { active: boolean; label: string; value: string; tone?: string; activeClass: string; hoverClass: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`min-w-[104px] rounded-xl border px-3 py-2 text-left transition ${hoverClass} ${active ? activeClass : "border-gray-100 bg-white"}`}><p className="text-xs text-gray-400">{label}</p><p className={`font-semibold ${tone}`}>{value}</p></button>;
}
