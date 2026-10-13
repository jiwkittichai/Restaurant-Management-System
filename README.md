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

### 2. สร้างไฟล์ `.env`

บน Windows Command Prompt:

```cmd
copy .env.example .env
```

จากนั้นเปิด `.env` แล้วเปลี่ยนรหัสผ่านและค่าที่จำเป็นสำหรับเครื่องของตัวเอง โดยเฉพาะ `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`, `DATABASE_URL`, `SEED_OWNER_PASSWORD` และ `PLATFORM_ADMIN_PASSWORD` ห้ามนำรหัสผ่านจริงใน `.env` ขึ้น GitHub

### 3. สร้าง Prisma Client

```bash
npx prisma generate
```

### 4. เปิดบริการ Docker

```bash
docker compose up -d
```

### 5. สร้างโครงสร้างฐานข้อมูล

```bash
npx prisma migrate deploy
```

### 6. ตั้งต้นระบบและสร้างแอดมินแพลตฟอร์ม

ตั้งค่า `PLATFORM_ADMIN_USERNAME`, `PLATFORM_ADMIN_DISPLAY_NAME` และ `PLATFORM_ADMIN_PASSWORD` ใน `.env` โดยเปลี่ยนรหัสผ่านตัวอย่างเป็นรหัสผ่านส่วนตัว 12–128 ตัว และใช้ชื่อผู้ใช้/รหัสผ่านต่างจากบัญชีร้าน จากนั้นรัน:

```bash
npm run db:seed:platform
```

คำสั่งนี้ใช้ `scripts/init-platform.mjs` สร้างแอดมินเพื่อเซ็ตค่าเริ่มต้นของแพลตฟอร์ม

รันซ้ำได้: หากมีชื่อผู้ใช้นี้แล้ว จะไม่เปลี่ยนรหัสผ่าน ชื่อแสดง สถานะบัญชี หรือ session เดิม การแก้รหัสผ่านใน `.env` แล้วรันซ้ำจึงไม่ใช่การรีเซ็ตรหัสผ่าน หากชื่อผู้ใช้ชนกับบัญชีร้านจะหยุดโดยไม่เปลี่ยนข้อมูล เข้าสู่ระบบผ่าน `/login` ด้วยบัญชีแอดมินที่สร้างไว้


### 7. สร้าง MinIO Bucket

```bash
npm run minio:init
```

คำสั่งนี้จะสร้าง Bucket ชื่อ `products` สำหรับจัดเก็บรูปภาพเมนู และสามารถรันซ้ำได้โดยไม่ลบรูปเดิม

### 8. เปิดเว็บไซต์

```bash
npm run dev
```

เปิดเว็บไซต์ที่:

```text
http://localhost:3000
```

## ข้อมูลสำหรับสร้างร้านจำลองสำหรับทดสอบ

ตั้งค่า `SEED_OWNER_USERNAME`, `SEED_OWNER_PASSWORD`, `SEED_OWNER_EMAIL`, `SEED_RESTAURANT_NAME` และ `SEED_SALES_COUNT` ใน `.env` สำหรับบัญชีสร้างร้านจำลอง บัญชีเจ้าของร้าน เมนู ตัวเลือกเสริมพร้อมสูตรตัดสต็อก วัตถุดิบ โต๊ะ และยอดขาย

```bash
npm run db:seed
```

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
