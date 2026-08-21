import Link from "next/link";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { completeStripePromptPayOrder } from "@/lib/stripe";

type PageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function StripeSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const sessionId = params.session_id;
  let state: "paid" | "pending" | "error" = "error";
  let title = "ตรวจสอบการชำระเงินไม่สำเร็จ";
  let description = "ไม่พบรหัสรายการชำระเงินจาก Stripe";

  if (sessionId && user) {
    try {
      const result = await completeStripePromptPayOrder({ sessionId, employeeId: user.id });
      if (result.paid) {
        state = "paid";
        title = "รับชำระเงินแล้ว";
        description = "Stripe ยืนยันยอด PromptPay และระบบบันทึกบิลเรียบร้อยแล้ว";
      } else {
        state = "pending";
        title = "ยังรอการยืนยันจาก Stripe";
        description = "รายการนี้ยังไม่ขึ้นสถานะชำระเงินสำเร็จ";
      }
    } catch (error) {
      description = error instanceof Error ? error.message : "เกิดข้อผิดพลาดระหว่างตรวจสอบรายการ";
    }
  }

  const Icon = state === "paid" ? CheckCircle2 : state === "pending" ? Clock3 : XCircle;
  const tone = state === "paid" ? "text-emerald-600 bg-emerald-50" : state === "pending" ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";

  return (
    <div className="grid min-h-full place-items-center p-6">
      <section className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm">
        <div className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${tone}`}>
          <Icon size={30} />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Link href="/dashboard/tables" className="rounded-xl bg-[#356DDB] px-4 py-3 text-sm font-medium text-white">
            กลับไปหน้าโต๊ะ
          </Link>
          <Link href="/dashboard/takeaway" className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600">
            คิวซื้อกลับบ้าน
          </Link>
        </div>
      </section>
    </div>
  );
}
