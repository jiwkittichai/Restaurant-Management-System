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
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="text-center">
          <PlatformBrand fallbackIcon={<Store size={26} />} />
          <h1 className="mt-1 text-2xl font-semibold">สมัครใช้งาน</h1>
          <p className="mt-2 text-sm text-gray-400">กรอกข้อมูลสมัครใช้งาน</p>
        </div>
        {registrationOpen === false && <p role="status" className="mt-7 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">ขณะนี้ปิดรับสมัครร้านใหม่ชั่วคราว ร้านที่มีบัญชีแล้วเข้าสู่ระบบได้ตามปกติ</p>}
        {registrationOpen === null && <p role="status" className="mt-7 text-sm text-gray-500">{error || "กำลังตรวจสอบการเปิดรับสมัคร..."}</p>}
        {registrationOpen === true && <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block">
            <span className="text-sm text-gray-600">ชื่อร้าน</span>
            <div className="mt-1 flex items-center rounded-xl border border-gray-200 px-3 focus-within:border-blue-400">
              <Store size={17} className="text-gray-400" />
              <input required value={restaurantName} onChange={(event) => setRestaurantName(event.target.value)} className="w-full px-3 py-3 outline-none" />
            </div>
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">ชื่อเจ้าของร้าน</span>
            <div className="mt-1 flex items-center rounded-xl border border-gray-200 px-3 focus-within:border-blue-400">
              <UserRound size={17} className="text-gray-400" />
              <input required value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full px-3 py-3 outline-none" />
            </div>
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">ชื่อผู้ใช้</span>
            <div className="mt-1 flex items-center rounded-xl border border-gray-200 px-3 focus-within:border-blue-400">
              <UserRound size={17} className="text-gray-400" />
              <input required value={username} onChange={(event) => setUsername(event.target.value)} className="w-full px-3 py-3 outline-none" />
            </div>
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">อีเมล</span>
            <div className="mt-1 flex items-center rounded-xl border border-gray-200 px-3 focus-within:border-blue-400">
              <Mail size={17} className="text-gray-400" />
              <input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full px-3 py-3 outline-none" />
            </div>
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">รหัสผ่าน</span>
            <div className="mt-1 flex items-center rounded-xl border border-gray-200 px-3 focus-within:border-blue-400">
              <LockKeyhole size={17} className="text-gray-400" />
              <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full px-3 py-3 outline-none" />
            </div>
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-[#356DDB] py-3 text-white disabled:opacity-50">
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
