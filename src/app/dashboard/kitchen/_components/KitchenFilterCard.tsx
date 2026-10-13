/**
 * KitchenFilterCard แสดงข้อมูลแบบการ์ดในส่วนงานภายในครัว
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

export default function KitchenFilterCard({ active, label, value, tone, activeClass, hoverClass, onClick }: { active: boolean; label: string; value: string; tone: string; activeClass: string; hoverClass: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-xl border px-3 py-2 text-left transition ${hoverClass} ${active ? activeClass : "border-gray-100 bg-white"}`}><p className="truncate text-xs text-gray-400">{label}</p><p className={`font-semibold ${tone}`}>{value}</p></button>;
}
