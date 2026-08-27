import Link from "next/link";
import { ChevronRight, CreditCard } from "lucide-react";

const settingsItems = [
  {
    title: "การชำระเงิน",
    description: "ตั้งค่าเงินสด, QR พร้อมเพย์ของร้าน และ Stripe PromptPay",
    href: "/dashboard/settings/payments",
    icon: CreditCard,
  },
];

export default function SettingsPage() {
  return (
    <div className="p-4 lg:p-6">
      <section className="rounded-2xl border border-gray-100 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">ตั้งค่า</h2>
        <p className="mt-1 text-sm text-gray-400">จัดการค่าหลักของร้านและระบบหลังบ้าน</p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {settingsItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 transition hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <Icon size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
              <ChevronRight size={18} className="shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
            </Link>
          );
        })}
      </section>
    </div>
  );
}
