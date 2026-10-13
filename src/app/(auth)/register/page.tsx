/**
 * หน้าสมัครบัญชีและลงทะเบียนร้าน
 * ใช้รวมส่วนประกอบที่จำเป็นและเป็นจุดเริ่มต้นของการทำงานบนหน้าจอ
 */

"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { LockKeyhole, Mail, Store, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import PlatformBrand from "../_components/PlatformBrand";

export default function RegisterPage() {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/platform-info", { signal: controller.signal, cache: "no-store" })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(data => setRegistrationOpen(data.registrationOpen === true))
      .catch(() => { if (!controller.signal.aborted) setError("ตรวจสอบการเปิดรับสมัครไม่ได้ กรุณาโหลดหน้าใหม่"); });
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!registrationOpen) return;
    if (password !== confirmPassword) {
      setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    setLoading(true);
    setError("");
    try {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantName, displayName, username, password, email }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "สมัครใช้งานไม่สำเร็จ");
    router.replace(data.redirectTo || "/login?registered=pending");
    router.refresh();
    } catch { setError("เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่"); }
    finally { setLoading(false); }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f9] p-5">
      <div className="w-full max-w-2xl rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
        <div className="text-center">
          <PlatformBrand fallbackIcon={<Store size={26} />} />
          <h1 className="mt-1 text-2xl font-semibold">สมัครใช้งาน</h1>
          <p className="mt-2 text-sm text-gray-400">กรอกข้อมูลสมัครใช้งาน</p>
        </div>
        {registrationOpen === false && <p role="status" className="mt-7 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">ขณะนี้ปิดรับสมัครร้านใหม่ชั่วคราว ร้านที่มีบัญชีแล้วเข้าสู่ระบบได้ตามปกติ</p>}
        {registrationOpen === null && <p role="status" className="mt-7 text-sm text-gray-500">{error || "กำลังตรวจสอบการเปิดรับสมัคร..."}</p>}
        {registrationOpen === true && <form onSubmit={submit} className="mt-7">
          <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">ชื่อร้าน</span>
            <div className="mt-2 flex items-center rounded-xl border border-gray-200 px-3 transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50">
              <Store size={17} className="text-gray-400" />
              <input required maxLength={100} disabled={loading} value={restaurantName} onChange={(event) => setRestaurantName(event.target.value)} placeholder="ชื่อร้าน" className="w-full px-3 py-3 text-sm outline-none disabled:bg-gray-50" />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">ชื่อเจ้าของร้าน</span>
            <div className="mt-2 flex items-center rounded-xl border border-gray-200 px-3 transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50">
              <UserRound size={17} className="text-gray-400" />
              <input required maxLength={100} disabled={loading} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="ชื่อที่ใช้แสดงในระบบ" className="w-full px-3 py-3 text-sm outline-none disabled:bg-gray-50" />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">ชื่อผู้ใช้</span>
            <div className="mt-2 flex items-center rounded-xl border border-gray-200 px-3 transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50">
              <UserRound size={17} className="text-gray-400" />
              <input required minLength={3} maxLength={30} pattern="[a-zA-Z0-9._-]+" autoCapitalize="none" autoComplete="off" disabled={loading} value={username} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/^@+/, ""))} placeholder="username" className="w-full px-3 py-3 text-sm outline-none disabled:bg-gray-50" />
            </div>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">อีเมล</span>
            <div className="mt-2 flex items-center rounded-xl border border-gray-200 px-3 transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50">
              <Mail size={17} className="text-gray-400" />
              <input required type="email" maxLength={254} autoComplete="email" disabled={loading} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="owner@example.com" className="w-full px-3 py-3 text-sm outline-none disabled:bg-gray-50" />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">รหัสผ่าน</span>
            <div className="mt-2 flex items-center rounded-xl border border-gray-200 px-3 transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50">
              <LockKeyhole size={17} className="text-gray-400" />
              <input required type="password" minLength={8} maxLength={128} autoComplete="new-password" disabled={loading} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="อย่างน้อย 8 ตัวอักษร" className="w-full px-3 py-3 text-sm outline-none disabled:bg-gray-50" />
            </div>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">ยืนยันรหัสผ่าน</span>
            <div className="mt-2 flex items-center rounded-xl border border-gray-200 px-3 transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-50">
              <LockKeyhole size={17} className="text-gray-400" />
              <input required type="password" minLength={8} maxLength={128} autoComplete="new-password" disabled={loading} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="กรอกรหัสผ่านอีกครั้ง" className="w-full px-3 py-3 text-sm outline-none disabled:bg-gray-50" />
            </div>
          </label>
          </div>
          <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">หลังสมัคร ร้านจะอยู่ในสถานะรอผู้ดูแลระบบอนุมัติ เมื่ออนุมัติแล้วจึงเข้าสู่ระบบร้านได้</p>
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="mt-5 w-full rounded-xl bg-[#356DDB] py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {loading ? "กำลังสมัคร..." : "สมัครใช้งาน"}
          </button>
        </form>}
        <p className="mt-5 text-center text-sm text-gray-500">
          มีบัญชีอยู่แล้ว{" "}
          <Link href="/login" className="font-medium text-blue-600">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </main>
  );
}
