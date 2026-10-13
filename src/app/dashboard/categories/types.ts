/**
 * รวมรูปแบบข้อมูลที่ใช้ในหมวดหมู่เมนู
 * ใช้กำหนดว่าข้อมูลจาก API สถานะของหน้าจอ และข้อมูลที่ส่งระหว่างส่วนประกอบต้องมีหน้าตาอย่างไร
 */

export type Category = { id: number; name: string; color: string; _count: { menuItems: number } };
