import type { LucideIcon } from "lucide-react";

export type OverviewCard = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: string;
};

function CardsGrid({ cards }: { cards: OverviewCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <div
          key={label}
          className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-4 min-[420px]:flex-row min-[420px]:gap-3 sm:p-5"
        >
          <div
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl sm:h-11 sm:w-11 ${tone}`}
          >
            <Icon size={20} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs text-gray-400 sm:text-sm">{label}</p>
            <p className="truncate text-lg font-semibold text-gray-900 sm:text-xl">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SummaryCards({
  cards,
  title,
  description,
}: {
  cards: OverviewCard[];
  title?: string;
  description?: string;
}) {
  if (!title) return <CardsGrid cards={cards} />;

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-gray-400">{description}</p>
      )}
      <div className="mt-4">
        <CardsGrid cards={cards} />
      </div>
    </section>
  );
}
