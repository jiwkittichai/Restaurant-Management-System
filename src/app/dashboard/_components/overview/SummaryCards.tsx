import type { LucideIcon } from "lucide-react";

export type OverviewCard = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: string;
};

function CardsGrid({ cards }: { cards: OverviewCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <div
          key={label}
          className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5"
        >
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}
          >
            <Icon size={21} />
          </div>
          <div>
            <p className="text-sm text-gray-400">{label}</p>
            <p className="text-xl font-semibold text-gray-900">{value}</p>
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
    <section className="rounded-2xl border border-gray-100 bg-white p-5">
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
