"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, MailCheck } from "lucide-react";
import Link from "next/link";

export default function AccountTokenForm({ mode }: { mode: "verify" | "reset" | "forgot" }) {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [emailChange, setEmailChange] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("context") === "change") setEmailChange(true);
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token");
    if (value) { setToken(value); window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`); }
  }, []);
  const consume = (mode === "verify" || mode === "reset") && Boolean(token);
  const needsPassword = mode === "reset" && consume;
  const title = mode === "verify" ? emailChange ? "ยืนยันอีเมลใหม่" : "ยืนยันอีเมล" : mode === "reset" ? "ตั้งรหัสผ่านใหม่" : "ลืมรหัสผ่าน";
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    if (mode === "reset" && consume && password !== confirm) return setError("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/account-token", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consume ? { action: mode, token, password } : { action: mode === "verify" ? "resend" : "forgot", username, email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ทำรายการไม่สำเร็จ");
      setMessage(data.message); setPassword(""); setConfirm("");
      if (consume) { if (mode === "verify" && data.emailChanged) setEmailChange(true); setDone(true); setToken(""); }
    } catch (err) { setError(err instanceof Error ? err.message : "เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่"); }
    finally { setBusy(false); }
  }
  const description = done
    ? mode === "verify"
      ? emailChange ? "อีเมลใหม่ถูกบันทึกในบัญชีแล้ว คุณสามารถกลับไปตรวจสอบได้ที่หน้าบัญชีผู้ใช้" : "อีเมลของบัญชีได้รับการยืนยันแล้ว คุณสามารถกลับไปใช้งานระบบต่อได้"
      : "ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่"
    : consume
      ? mode === "verify"
        ? emailChange ? "กดยืนยันเพื่อเปลี่ยนอีเมลของบัญชีเป็นอีเมลใหม่นี้" : "กดยืนยันเพื่อเปิดใช้อีเมลนี้สำหรับการกู้บัญชี"
        : "ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ"
      : mode === "verify"
        ? "กรอกชื่อผู้ใช้และอีเมลของบัญชีเพื่อขอลิงก์ยืนยันอีกครั้ง"
        : "กรอกชื่อผู้ใช้และอีเมลเพื่อรับลิงก์ตั้งรหัสผ่านใหม่";

  return <section className="mx-auto w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
    <div className={`mb-5 grid h-12 w-12 place-items-center rounded-2xl ${done ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
      {done ? <CheckCircle2 size={24} /> : <MailCheck size={24} />}
    </div>
    <h1 className="text-2xl font-semibold">{done && mode === "verify" ? emailChange ? "เปลี่ยนอีเมลสำเร็จ" : "ยืนยันอีเมลสำเร็จ" : title}</h1>
    <p className="mt-3 text-sm leading-6 text-gray-500">{description}</p>
    {!done && <form onSubmit={submit} className="mt-6 space-y-4">
      {!consume && <label className="block text-sm">ชื่อผู้ใช้<input required minLength={3} maxLength={30} pattern="[a-zA-Z0-9._-]+" autoComplete="username" value={username} onChange={e => setUsername(e.target.value.toLowerCase())} className="mt-1 w-full rounded-xl border border-gray-200 p-3" /></label>}
      {!consume && <label className="block text-sm">อีเมล<input required type="email" maxLength={254} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-3" /></label>}
      {needsPassword && <label className="block text-sm">{mode === "reset" ? "รหัสผ่านใหม่" : "รหัสผ่านบัญชีปัจจุบัน"}<input required type="password" minLength={8} maxLength={128} autoComplete={mode === "reset" ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-3" /></label>}
      {mode === "reset" && consume && <label className="block text-sm">ยืนยันรหัสผ่านใหม่<input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-3" /></label>}
      <button disabled={busy} className="w-full rounded-xl bg-[#356DDB] p-3 text-white disabled:opacity-50">{busy ? "กำลังดำเนินการ..." : consume ? "ยืนยัน" : mode === "verify" ? "ส่งลิงก์ทางอีเมล" : "รีเซ็ตรหัสผ่าน"}</button>
    </form>}
    {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
    {message && !done && <p role="status" className="mt-4 text-sm text-green-700">{message}</p>}
    <Link href={done && mode === "verify" ? "/dashboard/settings/account" : "/login"} className="mt-6 block rounded-xl bg-blue-50 px-4 py-3 text-center text-sm font-medium text-blue-600">
      {done && mode === "verify" ? "กลับไปหน้าบัญชีผู้ใช้" : "กลับไปเข้าสู่ระบบ"}
    </Link>
  </section>;
}
