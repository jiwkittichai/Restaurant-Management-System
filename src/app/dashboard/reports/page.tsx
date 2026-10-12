import ReportsPageClient from "./_components/ReportsPageClient";
import { reportFilterState } from "./filter-state";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const initialFilters = reportFilterState(await searchParams);
  return <ReportsPageClient initialFilters={initialFilters} />;
}
