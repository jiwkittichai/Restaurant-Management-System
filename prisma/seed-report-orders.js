const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const REPORT_SEED_NOTE = "REPORT_SEED";

function rand(seed) {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function dateAt(year, month, day, hour, minute) {
  return new Date(year, month, day, hour, minute, 0, 0);
}

function keyOf(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

async function loadRealMenu() {
  const items = await prisma.menuItem.findMany({
    where: {
      sku: { not: { startsWith: "DEMO-REPORT-" } },
      available: true,
    },
    include: { recipes: true },
    orderBy: { id: "asc" },
  });
  if (!items.length) {
    throw new Error("ไม่พบเมนูจริงสำหรับสร้างข้อมูลรายงาน กรุณารัน npm run db:seed หรือเพิ่มเมนูอาหารก่อน");
  }
  return items;
}

async function loadRestaurantTables() {
  const tables = await prisma.restaurantTable.findMany({
    where: { name: { not: "Demo Report" } },
    orderBy: { id: "asc" },
  });
  if (!tables.length) {
    throw new Error("ไม่พบโต๊ะจริงสำหรับสร้างข้อมูลรายงาน กรุณารัน npm run db:seed ก่อน");
  }
  return tables;
}

function buildOrderItems(menuItems, seed) {
  const count = 1 + Math.floor(rand(seed) * 3);
  const picked = [];
  for (let index = 0; index < count; index += 1) {
    const source = menuItems[Math.floor(rand(seed + index + 1) * menuItems.length)];
    picked.push({
      source,
      menuItemId: source.id,
      name: source.name,
      price: source.price,
      qty: 1 + Math.floor(rand(seed + index + 7) * 3),
      status: "SERVED",
    });
  }
  return picked;
}

function summarizeRequirements(items) {
  const required = new Map();
  for (const item of items) {
    for (const recipe of item.source.recipes) {
      required.set(recipe.ingredientId, (required.get(recipe.ingredientId) || 0) + recipe.quantity * item.qty);
    }
  }
  return required;
}

async function main() {
  const year = Number(process.env.SEED_REPORT_YEAR || new Date().getFullYear());
  const today = new Date();
  const maxMonth = year === today.getFullYear() ? today.getMonth() : 11;
  const existing = await prisma.order.findMany({
    where: {
      OR: [
        { note: REPORT_SEED_NOTE },
        { orderNumber: { startsWith: `REPORT-SEED-${year}-` } },
        { orderNumber: { startsWith: `DEMO-REPORT-${year}-` } },
      ],
    },
    select: { id: true, orderNumber: true },
  });
  if (existing.length) {
    const orderIds = existing.map((order) => String(order.id));
    const orderNumbers = existing.map((order) => order.orderNumber);
    await prisma.auditLog.deleteMany({
      where: { entityType: "Order", entityId: { in: orderIds } },
    });
    await prisma.stockMovement.deleteMany({
      where: { reference: { in: orderNumbers } },
    });
    await prisma.order.deleteMany({ where: { id: { in: existing.map((order) => order.id) } } });
  }
  await prisma.menuItem.deleteMany({ where: { sku: { startsWith: "DEMO-REPORT-" } } });
  await prisma.category.deleteMany({ where: { name: "Demo Reports" } });
  await prisma.restaurantTable.deleteMany({ where: { name: "Demo Report" } });
  await prisma.stockMovement.deleteMany({
    where: { note: "ปรับสต็อกตั้งต้นสำหรับข้อมูลจำลองรายงาน" },
  });

  const menuItems = await loadRealMenu();
  const tables = await loadRestaurantTables();
  const owner = await prisma.employee.findFirst({
    where: { roles: { some: { role: "OWNER" } } },
    orderBy: { id: "asc" },
  });

  const saleDateMap = new Map();
  for (let month = 0; month <= maxMonth; month += 1) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const maxDay = year === today.getFullYear() && month === today.getMonth() ? today.getDate() : daysInMonth;
    for (const day of [3, 7, 11, 16, 21, 26].filter((value) => value <= maxDay)) {
      saleDateMap.set(keyOf(year, month, day), { year, month, day, count: 2 + Math.floor(rand(year + month * 31 + day) * 5) });
    }
    if (year === today.getFullYear() && month === today.getMonth()) {
      for (let day = 1; day <= maxDay; day += 1) {
        saleDateMap.set(keyOf(year, month, day), { year, month, day, count: 1 + Math.floor(rand(year + day) * 4) });
      }
    }
  }

  if (year === today.getFullYear()) {
    for (let index = 6; index >= 0; index -= 1) {
      const date = addDays(today, -index);
      saleDateMap.set(keyOf(date.getFullYear(), date.getMonth(), date.getDate()), {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),
        count: 3 + Math.floor(rand(year + index) * 4),
      });
    }
    saleDateMap.set(keyOf(today.getFullYear(), today.getMonth(), today.getDate()), {
      year: today.getFullYear(),
      month: today.getMonth(),
      day: today.getDate(),
      hours: [10, 11, 12, 13, 15, 18, 19, 21],
    });
  }

  let created = 0;
  for (const spec of [...saleDateMap.values()].sort((a, b) => keyOf(a.year, a.month, a.day).localeCompare(keyOf(b.year, b.month, b.day)))) {
    const hours = spec.hours || Array.from({ length: spec.count }, (_, index) => 10 + ((index * 2 + spec.day) % 11));
    for (let orderIndex = 0; orderIndex < hours.length; orderIndex += 1) {
      const seed = spec.year * 10000 + spec.month * 100 + spec.day * 10 + orderIndex;
      const paidAt = dateAt(spec.year, spec.month, spec.day, hours[orderIndex], Math.floor(rand(seed + 1) * 60));
      const items = buildOrderItems(menuItems, seed);
      const required = summarizeRequirements(items);
      const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const discount = rand(seed + 2) > 0.82 ? Math.round(subtotal * 0.05) : 0;
      const total = subtotal - discount;
      const method = rand(seed + 3) > 0.42 ? "PROMPTPAY" : "CASH";
      const type = rand(seed + 5) > 0.3 ? "DINE_IN" : "TAKEAWAY";
      const table = type === "DINE_IN" ? tables[Math.floor(rand(seed + 6) * tables.length)] : null;
      const receivedAmount = method === "CASH" ? total + (rand(seed + 4) > 0.6 ? 100 : 0) : total;
      const changeAmount = method === "CASH" ? Math.max(0, receivedAmount - total) : 0;
      const datePart = `${String(spec.month + 1).padStart(2, "0")}${String(spec.day).padStart(2, "0")}`;
      const orderPart = String(orderIndex + 1).padStart(2, "0");
      const orderNumber = `ORD-${String(spec.year).slice(-2)}${datePart}${orderPart}`;

      await prisma.$transaction(async (tx) => {
        const order = await tx.order.create({
          data: {
            orderNumber,
            tableId: table?.id ?? null,
            type,
            queueNumber: type === "TAKEAWAY" ? `Q${datePart}${orderPart}` : null,
            status: "SERVED",
            paymentStatus: "PAID",
            subtotal,
            discount,
            total,
            note: REPORT_SEED_NOTE,
            stockDeducted: required.size > 0,
            createdAt: paidAt,
            updatedAt: paidAt,
            pickedUpAt: type === "TAKEAWAY" ? paidAt : null,
            items: {
              create: items.map(({ source, ...item }) => ({
                ...item,
                createdAt: paidAt,
                updatedAt: paidAt,
              })),
            },
            payment: {
              create: {
                method,
                amount: total,
                receivedAmount,
                changeAmount,
                paidAt,
              },
            },
          },
          include: { table: true, items: true, payment: true },
        });

        for (const [ingredientId, quantity] of required) {
          const updated = await tx.ingredient.updateMany({
            where: { id: ingredientId, stock: { gte: quantity } },
            data: { stock: { decrement: quantity } },
          });
          if (!updated.count) throw new Error(`OUT_OF_STOCK:${ingredientId}`);
          await tx.stockMovement.create({
            data: {
              ingredientId,
              type: "STOCK_OUT",
              quantity,
              reference: order.orderNumber,
              note: "ตัดจากออเดอร์จำลองรายงาน",
              createdAt: paidAt,
            },
          });
        }

        await tx.auditLog.create({
          data: {
            employeeId: owner?.id ?? null,
            action: "CREATE_ORDER",
            entityType: "Order",
            entityId: String(order.id),
            details: {
              orderNumber: order.orderNumber,
              type: order.type,
              total: order.total,
              itemCount: items.reduce((sum, item) => sum + item.qty, 0),
              items: items.map((item) => ({ name: item.name, qty: item.qty, price: item.price })),
              tableName: order.table?.name,
              queueNumber: order.queueNumber,
              source: REPORT_SEED_NOTE,
            },
            createdAt: paidAt,
          },
        });
        await tx.auditLog.create({
          data: {
            employeeId: owner?.id ?? null,
            action: "PAY_ORDER",
            entityType: "Order",
            entityId: String(order.id),
            details: {
              orderNumber: order.orderNumber,
              method: order.payment?.method,
              total: order.total,
              receivedAmount: order.payment?.receivedAmount,
              changeAmount: order.payment?.changeAmount,
              source: REPORT_SEED_NOTE,
            },
            createdAt: paidAt,
          },
        });
      });
      created += 1;
    }
  }

  console.log(`Created ${created} realistic paid orders from existing menu items and tables for ${year}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
