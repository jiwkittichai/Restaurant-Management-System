const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

const obsoleteActions = [
  "LOGOUT",
  "UPDATE_KITCHEN_STATUS",
  "QR_TABLE_OPEN",
  "QR_TABLE_PAUSE",
  "QR_TABLE_RESUME",
  "QR_TABLE_CLOSE",
  "QR_TABLE_CLEAR-BILL",
  "UPLOAD_MENU_IMAGE",
  "UPLOAD_RESTAURANT_LOGO",
  "UPLOAD_PROMPTPAY_QR",
];

const groups = [
  { name: "เหตุการณ์ที่เลิกเก็บ", where: { action: { in: obsoleteActions } } },
  { name: "Login สำเร็จเกิน 90 วัน", where: { action: "LOGIN", createdAt: { lt: daysAgo(90) } } },
  {
    name: "เหตุการณ์ความปลอดภัยเกิน 180 วัน",
    where: { action: { in: ["LOGIN_FAILED", "LOGIN_INACTIVE"] }, createdAt: { lt: daysAgo(180) } },
  },
  {
    name: "ประวัติสำคัญเกิน 2 ปี",
    where: {
      action: { notIn: [...obsoleteActions, "LOGIN", "LOGIN_FAILED", "LOGIN_INACTIVE"] },
      createdAt: { lt: daysAgo(730) },
    },
  },
];

async function main() {
  let total = 0;
  for (const group of groups) {
    const count = await prisma.auditLog.count({ where: group.where });
    total += count;
    console.log(`${group.name}: ${count.toLocaleString("th-TH")} รายการ`);
  }

  if (!apply) {
    console.log(`รวม ${total.toLocaleString("th-TH")} รายการ (ยังไม่ได้ลบ; ใช้ --apply เพื่อยืนยัน)`);
    return;
  }

  const result = await prisma.$transaction(groups.map((group) => prisma.auditLog.deleteMany({ where: group.where })));
  const deleted = result.reduce((sum, item) => sum + item.count, 0);
  console.log(`ลบแล้ว ${deleted.toLocaleString("th-TH")} รายการ`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
