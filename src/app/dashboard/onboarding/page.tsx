import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user?.roles.includes("OWNER")) redirect("/login");
  const restaurantId = user.restaurantId;
  const [restaurant, email, menus, tables, staff] = await Promise.all([
    prisma.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, select: { name: true, phone: true, paymentSettings: true } }),
    prisma.employee.findUniqueOrThrow({ where: { id: user.id }, select: { emailVerifiedAt: true } }),
    prisma.menuItem.count({ where: { restaurantId } }),
    prisma.restaurantTable.count({ where: { restaurantId } }),
    prisma.employee.count({ where: { restaurantId, id: { not: user.id }, active: true } }),
  ]);
  const steps = [
    { title: "ตั้งค่าบัญชีผู้ใช้", done: Boolean(email.emailVerifiedAt), href: "/dashboard/settings/account", detail: "ตรวจสอบข้อมูลบัญชีและยืนยันอีเมลสำหรับกู้รหัสผ่าน" },
    { title: "ตรวจข้อมูลร้าน", done: Boolean(restaurant.phone), href: "/dashboard/settings/restaurant", detail: "ชื่อ โลโก้ และเบอร์ติดต่อที่จะปรากฏในระบบ" },
    { title: "เพิ่มหมวดหมู่และเมนู", done: menus > 0, href: "/dashboard/categories", detail: "สร้างหมวดหมู่ก่อน แล้วเพิ่มอาหารในหน้าเมนูสินค้า" },
    { title: "ตั้งโต๊ะอาหาร", done: tables > 0, href: "/dashboard/tables", detail: "สำหรับร้านกินที่ร้านและการสั่งผ่าน QR; ร้านซื้อกลับบ้านข้ามได้" },
    { title: "ตั้งค่าพร้อมเพย์ (ไม่บังคับ)", done: Boolean(restaurant.paymentSettings?.promptPayQrImageUrl), href: "/dashboard/settings/payments", detail: "ใช้เงินสดได้ทันที ส่วน QR ต้องตรวจเงินเข้าก่อนยืนยัน" },
    { title: "เพิ่มบัญชีพนักงาน (ไม่บังคับ)", done: staff > 0, href: "/dashboard/employees", detail: "แยกสิทธิ์แคชเชียร์ ครัว และสต็อก ไม่ต้องแชร์บัญชีเจ้าของ" },
  ];
  return <main className="mx-auto max-w-3xl p-6"><h1 className="text-2xl font-semibold">เริ่มต้นใช้งาน {restaurant.name}</h1><p className="mt-2 text-gray-500">ตรวจความพร้อมของร้านคุณ ข้ามรายการที่ยังไม่ใช้และกลับมาทำภายหลังได้</p><div className="mt-6 space-y-3">{steps.map(step => <Link key={step.href} href={step.href} className="block rounded-2xl border border-gray-100 bg-white p-5 hover:border-blue-300"><h2 className="font-medium">{step.done ? "✓" : "○"} {step.title}</h2><p className="mt-1 text-sm text-gray-500">{step.detail}</p></Link>)}</div><Link href="/dashboard" className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 text-white">ไปหน้าภาพรวมร้าน</Link></main>;
}
