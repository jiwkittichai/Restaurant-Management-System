export async function platformRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  if (response.status === 401) {
    window.location.assign("/login");
    throw new Error("กรุณาเข้าสู่ระบบใหม่");
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "ทำรายการไม่สำเร็จ");
  return result as T;
}

export function jsonRequest(method: "PATCH" | "DELETE", body?: unknown): RequestInit {
  return body === undefined
    ? { method }
    : { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
