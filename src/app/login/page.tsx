"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }),
    });
    const data = await response.json(); setLoading(false);
    if (!response.ok) return setError(data.error);
    router.replace(data.redirectTo || "/dashboard"); router.refresh();
  }

  return <main className="min-h-screen bg-[#f6f7f9] grid place-items-center p-5"><div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-sm p-8"><div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 grid place-items-center mb-5"><LockKeyhole size={26}/></div><p className="text-sm text-gray-400">Restaurant Management System</p><h1 className="text-2xl font-semibold mt-1">เข้าสู่ระบบ</h1><p className="text-sm text-gray-400 mt-2">เข้าสู่ระบบด้วยบัญชีพนักงานของคุณ</p><form onSubmit={submit} className="mt-7 space-y-4"><label className="block"><span className="text-sm text-gray-600">ชื่อผู้ใช้</span><div className="mt-1 flex items-center border border-gray-200 rounded-xl px-3 focus-within:border-blue-400"><UserRound size={17} className="text-gray-400"/><input autoFocus required value={username} onChange={e=>setUsername(e.target.value)} className="w-full px-3 py-3 outline-none"/></div></label><label className="block"><span className="text-sm text-gray-600">รหัสผ่าน</span><div className="mt-1 flex items-center border border-gray-200 rounded-xl px-3 focus-within:border-blue-400"><LockKeyhole size={17} className="text-gray-400"/><input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-3 py-3 outline-none"/></div></label>{error&&<p className="text-sm text-red-500">{error}</p>}<button disabled={loading} className="w-full rounded-xl bg-[#356DDB] text-white py-3 disabled:opacity-50">{loading?"กำลังเข้าสู่ระบบ...":"เข้าสู่ระบบ"}</button></form></div></main>;
}
