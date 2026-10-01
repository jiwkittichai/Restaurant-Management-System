export default function KitchenFilterCard({ active, label, value, tone, activeClass, hoverClass, onClick }: { active: boolean; label: string; value: string; tone: string; activeClass: string; hoverClass: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-xl border px-3 py-2 text-left transition ${hoverClass} ${active ? activeClass : "border-gray-100 bg-white"}`}><p className="truncate text-xs text-gray-400">{label}</p><p className={`font-semibold ${tone}`}>{value}</p></button>;
}
