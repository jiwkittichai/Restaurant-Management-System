# Restaurant Management System

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

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. สร้าง Prisma Client

```bash
npx prisma generate
```

### 3. เปิดบริการ Docker

```bash
docker compose up -d
```

### 4. สร้างโครงสร้างฐานข้อมูล

```bash
npx prisma migrate deploy
```

### 5. นำเข้าบัญชีแอดมินลง Database

```bash
npm run db:seed:platform
```

### 7. สร้าง MinIO Bucket

```bash
npm run minio:init
```

คำสั่งนี้จะสร้าง Bucket ชื่อ `products` สำหรับจัดเก็บรูปภาพเมนู และสามารถรันซ้ำได้โดยไม่ลบรูปเดิม


```

## นำเข้าข้อมูลร้านจำลองลง Database

สำหรับบัญชีสร้างร้านจำลอง บัญชีเจ้าของร้าน เมนู ตัวเลือกเสริมพร้อมสูตรตัดสต็อก วัตถุดิบ โต๊ะ และยอดขาย

```bash
npm run db:seed
```

### 8. เปิดเว็บไซต์

```bash
npm run dev
```

เปิดเว็บไซต์ที่:

```text
http://localhost:3000


## URL ของบริการ

| บริการ | URL |
|---|---|
| Restaurant Management System | http://localhost:3000 |
| phpMyAdmin | http://localhost:8080 |
| MinIO API | http://localhost:9000 |
| MinIO Console | http://localhost:9001 |


## สั่งอาหารผ่าน QR ประจำรอบโต๊ะ
### การทดลองสแกนจากมือถือ
- ให้มือถืออยู่ใน Wi-Fi เดียวกับคอม


## การกำหนดอีเมลของระบบ สำหรับใช้ฟังก์ชันรีเซ็ตรหัสผ่าน เพื่อใช้ส่งข้อความอีเมลไปยังบัญชีต่างๆ เพื่อกดลิ้งรีเซ็ตรหัสผ่าน โดยตั้งค่าใน `.env`
ต้องตั้งค่า smtp จาก gmail ที่เราจะเซ็ตให้เป็น gmail หลักของระบบที่จะทำหน้าที่ส่งลิ้งไปให้กับอีเมลอื่นที่เรากรอกให้ในการ
