const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const REPORT_SEED_NOTE = "REPORT_SEED";
const REPORT_INITIAL_STOCK_NOTE = "ปรับสต็อกตั้งต้นสำหรับข้อมูลจำลองรายงาน";
const FINAL_STOCK_NOTE = "ปรับยอดคงเหลือหลังจำลองข้อมูลขายให้เหมือนสต็อกร้านจริง";
const REPORT_INITIAL_STOCK = 10000000;

const finalStockSeed = [
  { name: "ข้าวสาร", stock: 7200 },
  { name: "เนื้อไก่", stock: 2600 },
  { name: "หมูสับ", stock: 3000 },
  { name: "หมูกรอบ", stock: 2100 },
  { name: "กุ้ง", stock: 1800 },
  { name: "ปลาหมึก", stock: 1500 },
  { name: "ไข่ไก่", stock: 85 },
  { name: "ใบกะเพรา", stock: 240 },
  { name: "กระเทียม", stock: 160 },
  { name: "พริกสด", stock: 130 },
  { name: "ซอสปรุงรส", stock: 650 },
  { name: "น้ำปลา", stock: 240 },
  { name: "น้ำมันพืช", stock: 850 },
  { name: "น้ำดื่ม", stock: 24 },
  { name: "โค้ก", stock: 18 },
];

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
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days
  );
}

function weightedPick(items, seed) {
  const weights = {
    "KAPRAO-PORK": 18,
    "KAPRAO-CRISPY": 15,
    "KAPRAO-CHK": 13,
    "KAPRAO-SEAFOOD": 11,
    "FRIEDRICE-PORK": 10,
    "FRIEDRICE-CRISPY": 8,
    "FRIEDRICE-SEAFOOD": 8,
    OMELETTE: 7,
    "OMELETTE-PORK": 6,
    "OMELETTE-SHRIMP": 5,
    "DRINK-WATER": 7,
    "DRINK-COLA": 6,
  };

  const total = items.reduce(
    (sum, item) => sum + (weights[item.sku] || 4),
    0
  );

  let cursor = rand(seed) * total;

  for (const item of items) {
    cursor -= weights[item.sku] || 4;

    if (cursor <= 0) {
      return item;
    }
  }

  return items[items.length - 1];
}

async function loadRealMenu(restaurantId) {
  const items = await prisma.menuItem.findMany({
    where: {
      restaurantId,
      sku: {
        not: {
          startsWith: "DEMO-REPORT-",
        },
      },
      available: true,
    },
    include: {
      category: true,
      recipes: true,

      modifiers: {
        where: {
          active: true,
        },
        include: {
          recipes: true,
        },
        orderBy: {
          id: "asc",
        },
      },

      modifierGroups: {
        include: {
          options: {
            where: {
              active: true,
            },
            include: {
              recipes: true,
            },
            orderBy: {
              id: "asc",
            },
          },
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            id: "asc",
          },
        ],
      },
    },

    orderBy: {
      id: "asc",
    },
  });

  if (!items.length) {
    throw new Error(
      "ไม่พบเมนูจริงสำหรับสร้างข้อมูลรายงาน กรุณารัน npm run db:seed หรือเพิ่มเมนูอาหารก่อน"
    );
  }

  return items;
}

async function loadRestaurantTables(restaurantId) {
  const tables = await prisma.restaurantTable.findMany({
    where: {
      restaurantId,
      name: {
        not: "Demo Report",
      },
    },

    orderBy: {
      id: "asc",
    },
  });

  if (!tables.length) {
    throw new Error(
      "ไม่พบโต๊ะจริงสำหรับสร้างข้อมูลรายงาน กรุณารัน npm run db:seed ก่อน"
    );
  }

  return tables;
}

function buildOrderItems(menuItems, seed) {
  const mains = menuItems.filter(
    (item) =>
      item.category?.name !== "เครื่องดื่ม" &&
      !item.sku.startsWith("DRINK-")
  );

  const drinks = menuItems.filter((item) =>
    item.sku.startsWith("DRINK-")
  );

  const count = 2 + Math.floor(rand(seed) * 3);

  const picked = [];

  for (let index = 0; index < count; index += 1) {
    const useDrink =
      drinks.length > 0 &&
      (index > 0
        ? rand(seed + index + 23) > 0.78
        : rand(seed + 99) > 0.94);

    const source = useDrink
      ? weightedPick(drinks, seed + index + 1)
      : weightedPick(
          mains.length ? mains : menuItems,
          seed + index + 1
        );

    const modifiers = [];

    for (const group of source.modifierGroups) {
      if (
        group.name === "ระดับความเผ็ด" &&
        rand(seed + index + group.id) > 0.55
      ) {
        const selected =
          group.options[
            Math.floor(
              rand(seed + index + group.id + 1) *
                group.options.length
            )
          ];

        if (selected) {
          modifiers.push(selected);
        }
      } else if (group.name === "ตัวเลือกเสริม") {
        for (const option of group.options) {
          if (
            rand(seed + index + option.id + 11) >
            (option.name === "พิเศษ" ? 0.58 : 0.72)
          ) {
            modifiers.push(option);
          }
        }
      }
    }

    const modifierTotal = modifiers.reduce(
      (sum, modifier) => sum + modifier.price,
      0
    );

    picked.push({
      source,
      modifiers,
      menuItemId: source.id,
      name: source.name,
      price: source.price + modifierTotal,

      qty: source.sku.startsWith("DRINK-")
        ? 1 + Math.floor(rand(seed + index + 7) * 2)
        : 1 + (rand(seed + index + 7) > 0.82 ? 1 : 0),

      status: "SERVED",
    });
  }

  return picked;
}

function summarizeRequirements(items) {
  const required = new Map();

  for (const item of items) {
    for (const recipe of item.source.recipes) {
      required.set(
        recipe.ingredientId,
        (required.get(recipe.ingredientId) || 0) +
          recipe.quantity * item.qty
      );
    }

    for (const modifier of item.modifiers) {
      for (const recipe of modifier.recipes) {
        required.set(
          recipe.ingredientId,
          (required.get(recipe.ingredientId) || 0) +
            recipe.quantity * item.qty
        );
      }
    }
  }

  return required;
}

async function main() {
  /*
   * ==========================================
   * กำหนดช่วงวันที่สำหรับข้อมูล Seed
   * ==========================================
   *
   * ข้อมูลจะสิ้นสุดตายตัวที่:
   *
   * 25/08/2026
   *
   * ไม่ว่ารันไฟล์นี้วันที่เท่าไรก็ตาม
   * จะไม่สร้างข้อมูลหลังวันที่ 25 สิงหาคม
   */

  const year = Number(
    process.env.SEED_REPORT_YEAR || 2026
  );

  const seedEndDate = new Date(
    year,
    7,   // August (January = 0)
    25,
    23,
    59,
    59,
    999
  );

  const maxMonth = seedEndDate.getMonth();
  const restaurantSlug =
    process.env.SEED_RESTAURANT_SLUG ||
    "default-restaurant";

  const restaurant =
    await prisma.restaurant.findUnique({
      where: {
        slug: restaurantSlug,
      },
    });

  if (!restaurant) {
    throw new Error(
      "ไม่พบร้านสำหรับ seed ข้อมูลรายงาน กรุณารัน npm run db:seed ก่อน"
    );
  }

  /*
   * ==========================================
   * ลบข้อมูล Seed ชุดเก่า
   * ==========================================
   */

  const existing = await prisma.order.findMany({
    where: {
      restaurantId:
        restaurant.id,
      OR: [
        {
          note: REPORT_SEED_NOTE,
        },
        {
          orderNumber: {
            startsWith: `REPORT-SEED-${year}-`,
          },
        },
        {
          orderNumber: {
            startsWith: `DEMO-REPORT-${year}-`,
          },
        },
      ],
    },

    select: {
      id: true,
      orderNumber: true,
    },
  });

  const seededAudits =
    await prisma.auditLog.findMany({
      where: {
        restaurantId:
          restaurant.id,
        entityType: "Order",
      },

      select: {
        entityId: true,
        details: true,
      },
    });

  const auditOrderIds = seededAudits
    .filter(
      (audit) =>
        audit.details &&
        typeof audit.details === "object" &&
        !Array.isArray(audit.details) &&
        audit.details.source === REPORT_SEED_NOTE
    )
    .map((audit) => Number(audit.entityId))
    .filter((id) => Number.isInteger(id));

  const existingIds = [
    ...new Set([
      ...existing.map((order) => order.id),
      ...auditOrderIds,
    ]),
  ];

  if (existingIds.length) {
    const existingOrders =
      await prisma.order.findMany({
        where: {
          id: {
            in: existingIds,
          },
        },

        select: {
          id: true,
          orderNumber: true,
        },
      });

    const orderIds = existingOrders.map(
      (order) => String(order.id)
    );

    const orderNumbers = existingOrders.map(
      (order) => order.orderNumber
    );

    await prisma.auditLog.deleteMany({
      where: {
        restaurantId:
          restaurant.id,
        entityType: "Order",

        entityId: {
          in: orderIds,
        },
      },
    });

    await prisma.stockMovement.deleteMany({
      where: {
        restaurantId:
          restaurant.id,
        reference: {
          in: orderNumbers,
        },
      },
    });

    await prisma.order.deleteMany({
      where: {
        id: {
          in: existingOrders.map(
            (order) => order.id
          ),
        },
      },
    });
  }

  await prisma.menuItem.deleteMany({
    where: {
      restaurantId:
        restaurant.id,
      sku: {
        startsWith: "DEMO-REPORT-",
      },
    },
  });

  await prisma.category.deleteMany({
    where: {
      restaurantId:
        restaurant.id,
      name: "Demo Reports",
    },
  });

  await prisma.restaurantTable.deleteMany({
    where: {
      restaurantId:
        restaurant.id,
      name: "Demo Report",
    },
  });

  await prisma.stockMovement.deleteMany({
    where: {
      restaurantId:
        restaurant.id,
      note: {
        in: [
          REPORT_INITIAL_STOCK_NOTE,
          FINAL_STOCK_NOTE,
        ],
      },
    },
  });

  /*
   * ==========================================
   * โหลดข้อมูลจริง
   * ==========================================
   */

  const menuItems = await loadRealMenu(restaurant.id);

  const tables =
    await loadRestaurantTables(restaurant.id);

  const owner =
    await prisma.employee.findFirst({
      where: {
        restaurantId:
          restaurant.id,
        roles: {
          some: {
            role: "OWNER",
          },
        },
      },

      orderBy: {
        id: "asc",
      },
    });

  for (const item of finalStockSeed) {
    const current = await prisma.ingredient.findUnique({
      where: {
        restaurantId_name: {
          restaurantId:
            restaurant.id,
          name:
            item.name,
        },
      },
    });

    if (!current) {
      continue;
    }

    const quantity =
      REPORT_INITIAL_STOCK - current.stock;

    await prisma.ingredient.update({
      where: {
        id: current.id,
      },
      data: {
        stock: REPORT_INITIAL_STOCK,
      },
    });

    await prisma.stockMovement.create({
      data: {
        restaurantId:
          restaurant.id,
        ingredientId:
          current.id,
        type:
          "ADJUSTMENT",
        quantity,
        note:
          REPORT_INITIAL_STOCK_NOTE,
      },
    });
  }

  /*
   * ==========================================
   * สร้างรายการวันที่
   *
   * 01/01/2026
   * ถึง
   * 25/08/2026
   * ==========================================
   */

  const saleDateMap = new Map();

  for (
    let month = 0;
    month <= maxMonth;
    month += 1
  ) {
    const daysInMonth = new Date(
      year,
      month + 1,
      0
    ).getDate();

    const maxDay =
      month === seedEndDate.getMonth()
        ? seedEndDate.getDate()
        : daysInMonth;

    for (
      let day = 1;
      day <= maxDay;
      day += 1
    ) {
      const weekday = new Date(
        year,
        month,
        day
      ).getDay();

      const weekendBoost =
        weekday === 0 || weekday === 6
          ? 2
          : 0;

      saleDateMap.set(
        keyOf(year, month, day),
        {
          year,
          month,
          day,

          count:
            5 +
            weekendBoost +
            Math.floor(
              rand(
                year +
                  month * 31 +
                  day
              ) * 4
            ),
        }
      );
    }
  }

  /*
   * ==========================================
   * ปรับข้อมูล 7 วันสุดท้าย
   *
   * 19/08 - 25/08
   * ==========================================
   */

  for (
    let index = 6;
    index >= 0;
    index -= 1
  ) {
    const date = addDays(
      seedEndDate,
      -index
    );

    saleDateMap.set(
      keyOf(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ),
      {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate(),

        count:
          6 +
          Math.floor(
            rand(year + index) * 4
          ),
      }
    );
  }

  /*
   * วันที่ 25/08
   * กำหนดเวลาออเดอร์โดยตรง
   */

  saleDateMap.set(
    keyOf(
      year,
      seedEndDate.getMonth(),
      seedEndDate.getDate()
    ),
    {
      year,

      month:
        seedEndDate.getMonth(),

      day:
        seedEndDate.getDate(),

      hours: [
        10,
        11,
        12,
        13,
        15,
        18,
        19,
        21,
      ],
    }
  );

  /*
   * ==========================================
   * สร้าง Order
   * ==========================================
   */

  let created = 0;

  const sortedSaleDates = [
    ...saleDateMap.values(),
  ].sort((a, b) =>
    keyOf(
      a.year,
      a.month,
      a.day
    ).localeCompare(
      keyOf(
        b.year,
        b.month,
        b.day
      )
    )
  );

  for (const spec of sortedSaleDates) {
    const hours =
      spec.hours ||
      Array.from(
        {
          length: spec.count,
        },
        (_, index) =>
          10 +
          ((index * 2 + spec.day) % 11)
      );

    for (
      let orderIndex = 0;
      orderIndex < hours.length;
      orderIndex += 1
    ) {
      const seed =
        spec.year * 10000 +
        spec.month * 100 +
        spec.day * 10 +
        orderIndex;

      const hour =
        hours[orderIndex];

      const minute =
        Math.floor(
          rand(seed + 1) * 60
        );

      const paidAt = dateAt(
        spec.year,
        spec.month,
        spec.day,
        hour,
        minute
      );

      const items =
        buildOrderItems(
          menuItems,
          seed
        );

      const required =
        summarizeRequirements(items);

      const subtotal =
        items.reduce(
          (sum, item) =>
            sum +
            item.price * item.qty,
          0
        );

      const discount = 0;

      const total =
        subtotal - discount;

      const method =
        rand(seed + 3) > 0.42
          ? "PROMPTPAY"
          : "CASH";

      const type =
        rand(seed + 5) > 0.3
          ? "DINE_IN"
          : "TAKEAWAY";

      const table =
        type === "DINE_IN"
          ? tables[
              Math.floor(
                rand(seed + 6) *
                  tables.length
              )
            ]
          : null;

      const receivedAmount =
        method === "CASH"
          ? total +
            (rand(seed + 4) > 0.6
              ? 100
              : 0)
          : total;

      const changeAmount =
        method === "CASH"
          ? Math.max(
              0,
              receivedAmount - total
            )
          : 0;

      const datePart =
        `${String(
          spec.month + 1
        ).padStart(2, "0")}${String(
          spec.day
        ).padStart(2, "0")}`;

      const orderPart =
        String(
          orderIndex + 1
        ).padStart(2, "0");

      const orderNumber =
        `ORD-${String(
          spec.year
        ).slice(-2)}${datePart}${orderPart}`;

      await prisma.$transaction(
        async (tx) => {
          const order =
            await tx.order.create({
              data: {
                restaurantId:
                  restaurant.id,

                orderNumber,

                tableId:
                  table?.id ?? null,

                type,

                queueNumber:
                  type === "TAKEAWAY"
                    ? `Q${datePart}${orderPart}`
                    : null,

                status: "SERVED",

                paymentStatus: "PAID",

                subtotal,

                discount,

                total,

                note: null,

                stockDeducted:
                  required.size > 0,

                createdAt:
                  paidAt,

                updatedAt:
                  paidAt,

                pickedUpAt:
                  type === "TAKEAWAY"
                    ? paidAt
                    : null,

                items: {
                  create:
                    items.map(
                      ({
                        source,
                        modifiers,
                        ...item
                      }) => ({
                        ...item,

                        createdAt:
                          paidAt,

                        updatedAt:
                          paidAt,

                        modifiers: {
                          create:
                            modifiers.map(
                              (
                                modifier
                              ) => ({
                                modifierId:
                                  modifier.id,

                                name:
                                  modifier.name,

                                price:
                                  modifier.price,
                              })
                            ),
                        },
                      })
                    ),
                },

                payment: {
                  create: {
                    restaurantId:
                      restaurant.id,

                    method,

                    amount: total,

                    receivedAmount,

                    changeAmount,

                    paidAt,
                  },
                },
              },

              include: {
                table: true,

                items: {
                  include: {
                    modifiers: true,
                  },
                },

                payment: true,
              },
            });

          /*
           * ตัด Stock
           */

          for (
            const [
              ingredientId,
              quantity,
            ] of required
          ) {
            const updated =
              await tx.ingredient.updateMany({
                where: {
                  id: ingredientId,

                  restaurantId:
                    restaurant.id,

                  stock: {
                    gte: quantity,
                  },
                },

                data: {
                  stock: {
                    decrement:
                      quantity,
                  },
                },
              });

            if (!updated.count) {
              throw new Error(
                `OUT_OF_STOCK:${ingredientId}`
              );
            }

            await tx.stockMovement.create({
              data: {
                restaurantId:
                  restaurant.id,

                ingredientId,

                type: "STOCK_OUT",

                quantity,

                reference:
                  order.orderNumber,

                note:
                  "ตัดจากออเดอร์จำลองรายงาน",

                createdAt:
                  paidAt,
              },
            });
          }

          /*
           * Audit Log:
           * CREATE_ORDER
           */

          await tx.auditLog.create({
            data: {
              restaurantId:
                restaurant.id,

              employeeId:
                owner?.id ?? null,

              action:
                "CREATE_ORDER",

              entityType:
                "Order",

              entityId:
                String(order.id),

              details: {
                orderNumber:
                  order.orderNumber,

                type:
                  order.type,

                total:
                  order.total,

                itemCount:
                  items.reduce(
                    (sum, item) =>
                      sum + item.qty,
                    0
                  ),

                items:
                  items.map(
                    (item) => ({
                      name:
                        item.name,

                      qty:
                        item.qty,

                      price:
                        item.price,

                      modifiers:
                        item.modifiers.map(
                          (
                            modifier
                          ) => ({
                            name:
                              modifier.name,

                            price:
                              modifier.price,
                          })
                        ),
                    })
                  ),

                tableName:
                  order.table?.name,

                queueNumber:
                  order.queueNumber,

                source:
                  REPORT_SEED_NOTE,
              },

              createdAt:
                paidAt,
            },
          });

          /*
           * Audit Log:
           * PAY_ORDER
           */

          await tx.auditLog.create({
            data: {
              restaurantId:
                restaurant.id,

              employeeId:
                owner?.id ?? null,

              action:
                "PAY_ORDER",

              entityType:
                "Order",

              entityId:
                String(order.id),

              details: {
                orderNumber:
                  order.orderNumber,

                method:
                  order.payment?.method,

                total:
                  order.total,

                receivedAmount:
                  order.payment
                    ?.receivedAmount,

                changeAmount:
                  order.payment
                    ?.changeAmount,

                source:
                  REPORT_SEED_NOTE,
              },

              createdAt:
                paidAt,
            },
          });
        }
      );

      created += 1;
    }
  }

  /*
   * ==========================================
   * ปรับสต็อกหลัง Seed
   * ==========================================
   */

  for (
    const item of finalStockSeed
  ) {
    const current =
      await prisma.ingredient.findUnique({
        where: {
          restaurantId_name: {
            restaurantId:
              restaurant.id,
            name:
              item.name,
          },
        },
      });

    if (!current) {
      continue;
    }

    const quantity =
      item.stock - current.stock;

    await prisma.ingredient.update({
      where: {
        id: current.id,
      },

      data: {
        stock: item.stock,
      },
    });

    await prisma.stockMovement.create({
      data: {
        restaurantId:
          restaurant.id,

        ingredientId:
          current.id,

        type:
          "ADJUSTMENT",

        quantity,

        note:
          FINAL_STOCK_NOTE,
      },
    });
  }

  console.log(
    `Created ${created} realistic paid orders from 01/01/${year} through 25/08/${year}.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() =>
    prisma.$disconnect()
  );
