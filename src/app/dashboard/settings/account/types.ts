/**
 * รวมรูปแบบข้อมูลที่ใช้ในการตั้งค่าบัญชีผู้ใช้
 * ใช้กำหนดว่าข้อมูลจาก API สถานะของหน้าจอ และข้อมูลที่ส่งระหว่างส่วนประกอบต้องมีหน้าตาอย่างไร
 */

export type Account = {
  id: number;
  displayName: string;
  username: string;
  email: string;
  emailVerified: boolean;
};

export type Feedback = { type: "success" | "error"; text: string } | null;
export type AccountTask = "profile" | "email" | "password" | null;
