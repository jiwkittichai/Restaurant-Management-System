# Restaurant Management System

## ฟังก์ชันหลัก

- ระบบเข้าสู่ระบบและกำหนดสิทธิ์ตามบทบาท
- ระบบจัดการบัญชีพนักงาน
- ระบบรับออเดอร์แบบทานที่ร้านและซื้อกลับบ้าน
- ระบบจัดการโต๊ะและคิวซื้อกลับบ้าน
- ระบบหน้าจอครัวและติดตามสถานะอาหาร
- ระบบจัดการเมนูและหมวดหมู่
- ระบบวัตถุดิบ สูตรอาหาร และการตัดสต็อก
- ระบบบันทึกสถานะและช่องทางการชำระเงิน
- ระบบรายงานยอดขายและเมนูขายดี
- ระบบบันทึกประวัติกิจกรรมของพนักงาน

## เทคโนโลยีที่ใช้

- **Core Framework:** Next.js
- **Frontend & UI:** React, TypeScript, Tailwind CSS
- **Backend & API:** Next.js Route Handlers, Node.js
- **Database & ORM:** MySQL, Prisma ORM
- **Infrastructure & Tools:** Docker, MinIO, phpMyAdmin

## สิ่งที่ต้องติดตั้ง

- Node.js
- Docker Desktop
- Git

## การติดตั้งโปรเจค

### 1. 

```bash
cd Restaurant-Management-System
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

### 3. สร้างไฟล์ Environment

```bash
เปลี่ยนชื่อไฟล์ .env.example ให้เป็น .env
```

### 4. สร้าง Prisma Client

```bash
npx prisma generate
```

### 5. เปิดบริการ Docker

```bash
docker compose up -d
```

ตรวจสอบสถานะ Container:

```bash
docker compose ps
```

### 6. สร้างโครงสร้างฐานข้อมูล

```bash
npx prisma migrate deploy
```

### 7. หากต้องการสร้างข้อมูลจำลองเริ่มต้น (ไม่บังคับ ทำหรือไม่ทำก็ได้)

```bash
npm run db:seed
```

คำสั่งนี้จะสร้างข้อมูลเริ่มต้น ได้แก่:

- บัญชีเจ้าของร้าน
- หมวดหมู่และเมนูตัวอย่าง
- วัตถุดิบและสูตรอาหาร
- โต๊ะอาหาร


### 8. สร้าง MinIO Bucket

```bash
npm run minio:init
```

คำสั่งนี้จะสร้าง Bucket ชื่อ `products` สำหรับจัดเก็บรูปภาพเมนู และสามารถรันซ้ำได้โดยไม่ลบรูปเดิม

### 9. เปิดเว็บไซต์

```bash
npm run dev
```

เปิดเว็บไซต์ที่:

```text
http://localhost:3000
```

## URL ของบริการ

| บริการ | URL |
|---|---|
| Restaurant Management System | http://localhost:3000 |
| phpMyAdmin | http://localhost:8080 |
| MinIO API | http://localhost:9000 |
| MinIO Console | http://localhost:9001 |


## คำสั่งที่ใช้งานบ่อย

```bash
npm run dev
npm run build
npm run db:seed
npm run minio:init
docker compose up -d
docker compose down
docker compose ps
npx prisma generate
npx prisma migrate deploy
```

