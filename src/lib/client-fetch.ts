export async function fetchJson(input: RequestInfo | URL, init?: RequestInit): Promise<unknown> {
  const response = await fetch(input, init);
  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new Error(response.ok ? "เซิร์ฟเวอร์ส่งข้อมูลไม่ถูกต้อง" : `เซิร์ฟเวอร์ตอบกลับด้วยสถานะ ${response.status}`);
  }

  if (!response.ok) {
    const apiMessage = data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : "";
    throw new Error(apiMessage || `เซิร์ฟเวอร์ตอบกลับด้วยสถานะ ${response.status}`);
  }

  return data;
}
