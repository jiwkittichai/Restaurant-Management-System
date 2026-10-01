"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { LockKeyhole, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import PlatformBrand from "../_components/PlatformBrand";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("registered") === "pending") {
      setNotice("สมัครใช้งานเรียบร้อย กรุณารอการอนุมัติเพื่อเริ่มใช้งาน");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    try {
    const response = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error);
    router.replace(data.redirectTo || "/dashboard"); router.refresh();
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] grid place-items-center p-5">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <div className="text-center">
          <PlatformBrand fallbackIcon={<LockKeyhole size={26} />} />
          <h1 className="mt-1 text-2xl font-semibold">เข้าสู่ระบบ</h1>
          <p className="mt-2 text-sm text-gray-400">เข้าสู่ระบบด้วยบัญชีของคุณ</p>
        </div>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="block">
            <span className="text-sm text-gray-600">ชื่อผู้ใช้</span>
            <div className="mt-1 flex items-center border border-gray-200 rounded-xl px-3 focus-within:border-blue-400">
              <UserRound size={17} className="text-gray-400" />
              <input autoFocus required autoComplete="username" maxLength={31} value={username} onChange={e=>setUsername(e.target.value)} className="w-full px-3 py-3 outline-none" />
            </div>
          </label>
          <label className="block">
            <span className="text-sm text-gray-600">รหัสผ่าน</span>
            <div className="mt-1 flex items-center border border-gray-200 rounded-xl px-3 focus-within:border-blue-400">
              <LockKeyhole size={17} className="text-gray-400" />
              <input required type="password" autoComplete="current-password" maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-3 py-3 outline-none" />
            </div>
          </label>
          {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
          {error&&<p role="alert" className="text-sm text-red-500">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-[#356DDB] text-white py-3 disabled:opacity-50">{loading?"กำลังเข้าสู่ระบบ...":"เข้าสู่ระบบ"}</button>
        </form>
        <div className="mt-4 text-right text-sm text-blue-600"><Link href="/forgot-password">ลืมรหัสผ่าน</Link></div>
        <p className="mt-5 text-center text-sm text-gray-500">
          ยังไม่มีร้านในระบบ{" "}
          <Link href="/register" className="font-medium text-blue-600">
            สมัครใช้งาน
          </Link>
        </p>
      </div>
    </main>
  );
}
