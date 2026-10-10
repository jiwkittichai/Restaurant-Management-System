import type { OverviewCard } from "./SummaryCards";

export default function TodaySales({ cards }: { cards: OverviewCard[] }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5">
      <div>
        <h2 className="font-semibold text-gray-900">ยอดขายวันนี้</h2>
        <p className="mt-1 text-sm text-gray-400">สรุปยอดขาย จำนวนบิล ค่าเฉลี่ย และส่วนลดของวันที่เปิดใช้งานอยู่</p>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5">
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
              <Icon size={21} />
            </div>
            <div>
              <p className="text-sm text-gray-400">{label}</p>
              <p className="text-xl font-semibold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
