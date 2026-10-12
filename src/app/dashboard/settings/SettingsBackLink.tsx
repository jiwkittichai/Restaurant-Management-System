import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SettingsBackLink() {
  return (
    <Link
      href="/dashboard/settings"
      className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
    >
      <ArrowLeft size={17} />
      กลับ
    </Link>
  );
}
