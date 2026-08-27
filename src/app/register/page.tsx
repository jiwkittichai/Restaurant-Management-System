"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { LockKeyhole, Store, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantName, displayName, username, password }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return setError(data.error || "สมัครใช้งานไม่สำเร็จ");
    router.replace(data.redirectTo || "/dashboard");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f7f9] p-5">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
            <Store size={26} />
          </div>
          <p className="text-sm text-gray-400">Restaurant Management System</p>
          <h1 className="mt-1 text-2xl font-semibold">สมัครใช้งาน</h1>
          <p className="mt-2 text-sm text-gray-400">สร้างร้านและบัญชีเจ้าของร้านของคุณ</p>
        </div>
        <form onSubmit={submit} className="mt-7 space-y-4">
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
            <span className="text-sm text-gray-600">รหัสผ่าน</span>
            <div className="mt-1 flex items-center rounded-xl border border-gray-200 px-3 focus-within:border-blue-400">
              <LockKeyhole size={17} className="text-gray-400" />
              <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full px-3 py-3 outline-none" />
            </div>
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-[#356DDB] py-3 text-white disabled:opacity-50">
            {loading ? "กำลังสมัคร..." : "สมัครและสร้างร้าน"}
          </button>
        </form>
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
