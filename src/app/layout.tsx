/**
 * โครงหน้าหลักที่ครอบทุกหน้าในแอป
 * ใช้โหลดรูปแบบส่วนกลาง กำหนดภาษา และวางโครงสร้าง HTML พื้นฐาน
 */

import "./globals.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className="font-kanit">{children}</body>
    </html>
  );
}
