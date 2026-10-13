/**
 * FeedbackMessage แสดงข้อความแจ้งผลสำเร็จหรือข้อผิดพลาดในหน้าตั้งค่าบัญชี
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import type { Feedback } from "../types";

export default function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return (
    <p role={feedback.type === "error" ? "alert" : "status"} className={`mt-4 text-sm ${feedback.type === "error" ? "text-red-600" : "text-emerald-600"}`}>
      {feedback.text}
    </p>
  );
}
