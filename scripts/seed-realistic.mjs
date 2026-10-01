/** Explicit LOCAL reset to one approved restaurant with complete operating data. */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const INGREDIENTS = [
  ['ข้าวสาร', 'กรัม', 1900, '0.045000', 7200], ['เนื้อไก่', 'กรัม', 1100, '0.095000', 2600],
  ['หมูสับ', 'กรัม', 1100, '0.140000', 3000], ['หมูกรอบ', 'กรัม', 1200, '0.220000', 2100],
  ['กุ้ง', 'กรัม', 700, '0.360000', 1800], ['ปลาหมึก', 'กรัม', 700, '0.280000', 1500],
  ['ไข่ไก่', 'ฟอง', 20, '4.000000', 85], ['ใบกะเพรา', 'กรัม', 120, '0.120000', 240],
  ['กระเทียม', 'กรัม', 80, '0.090000', 160], ['พริกสด', 'กรัม', 60, '0.100000', 130],
  ['ซอสปรุงรส', 'มล.', 180, '0.040000', 650], ['น้ำปลา', 'มล.', 80, '0.035000', 240],
  ['น้ำมันพืช', 'มล.', 220, '0.055000', 850], ['น้ำดื่ม', 'ขวด', 10, '7.000000', 24],
  ['โค้ก', 'กระป๋อง', 10, '15.000000', 18],
];
const MENUS = [
  ['KAPRAO-CHK', 'ข้าวกะเพราไก่', 50, 'อาหารจานเดียว', [['ข้าวสาร',180],['เนื้อไก่',110],['ใบกะเพรา',12],['กระเทียม',8],['พริกสด',6],['ซอสปรุงรส',15],['น้ำมันพืช',18]]],
  ['KAPRAO-PORK', 'ข้าวกะเพราหมูสับ', 50, 'อาหารจานเดียว', [['ข้าวสาร',180],['หมูสับ',110],['ใบกะเพรา',12],['กระเทียม',8],['พริกสด',6],['ซอสปรุงรส',15],['น้ำมันพืช',18]]],
  ['KAPRAO-CRISPY', 'ข้าวกะเพราหมูกรอบ', 65, 'อาหารจานเดียว', [['ข้าวสาร',180],['หมูกรอบ',120],['ใบกะเพรา',12],['กระเทียม',8],['พริกสด',6],['ซอสปรุงรส',15],['น้ำมันพืช',14]]],
  ['KAPRAO-SEAFOOD', 'ข้าวกะเพราทะเล', 65, 'อาหารจานเดียว', [['ข้าวสาร',180],['กุ้ง',70],['ปลาหมึก',70],['ใบกะเพรา',12],['กระเทียม',8],['พริกสด',6],['ซอสปรุงรส',15],['น้ำมันพืช',18]]],
  ['FRIEDRICE-PORK', 'ข้าวผัดหมู', 50, 'อาหารจานเดียว', [['ข้าวสาร',190],['หมูสับ',95],['ไข่ไก่',1],['กระเทียม',6],['ซอสปรุงรส',18],['น้ำมันพืช',20]]],
  ['FRIEDRICE-CRISPY', 'ข้าวผัดหมูกรอบ', 65, 'อาหารจานเดียว', [['ข้าวสาร',190],['หมูกรอบ',105],['ไข่ไก่',1],['กระเทียม',6],['ซอสปรุงรส',18],['น้ำมันพืช',18]]],
  ['FRIEDRICE-SEAFOOD', 'ข้าวผัดทะเล', 60, 'อาหารจานเดียว', [['ข้าวสาร',190],['กุ้ง',65],['ปลาหมึก',65],['ไข่ไก่',1],['กระเทียม',6],['ซอสปรุงรส',18],['น้ำมันพืช',20]]],
  ['OMELETTE', 'ข้าวไข่เจียว', 40, 'อาหารจานเดียว', [['ข้าวสาร',180],['ไข่ไก่',2],['น้ำปลา',8],['น้ำมันพืช',22]]],
  ['OMELETTE-PORK', 'ข้าวไข่เจียวหมูสับ', 50, 'อาหารจานเดียว', [['ข้าวสาร',180],['ไข่ไก่',2],['หมูสับ',55],['น้ำปลา',8],['น้ำมันพืช',22]]],
  ['OMELETTE-SHRIMP', 'ข้าวไข่เจียวกุ้งสับ', 60, 'อาหารจานเดียว', [['ข้าวสาร',180],['ไข่ไก่',2],['กุ้ง',60],['น้ำปลา',8],['น้ำมันพืช',22]]],
  ['DRINK-WATER', 'น้ำเปล่า', 10, 'เครื่องดื่ม', [['น้ำดื่ม',1]]],
  ['DRINK-COLA', 'โค้ก', 15, 'เครื่องดื่ม', [['โค้ก',1]]],
];

export function validateConfig(env, fallbackEmail) {
  const username = (env.SEED_OWNER_USERNAME || '').trim().toLowerCase();
  const password = env.SEED_OWNER_PASSWORD || '';
  const email = (env.SEED_OWNER_EMAIL || fallbackEmail || 'owner@promraan.local').trim().toLowerCase();
  const restaurantName = (env.SEED_RESTAURANT_NAME || 'ครัวกันเอง').trim();
  const salesCount = Number(env.SEED_SALES_COUNT || 1683);
  if (!/^[a-z0-9._-]{3,20}$/.test(username) || password.length < 8 || password.length > 128 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !restaurantName || restaurantName.length > 100 || !Number.isSafeInteger(salesCount) || salesCount < 0 || salesCount > 10000) {
    throw new Error('Set valid SEED_OWNER_USERNAME, SEED_OWNER_PASSWORD, and optional SEED_OWNER_EMAIL, SEED_RESTAURANT_NAME, SEED_SALES_COUNT.');
  }
  return { username, password, email, restaurantName, salesCount };
}
function hashPassword(password) { const salt = randomBytes(16).toString('hex'); return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`; }
function slugFrom(name) { const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48); return base || `restaurant-${Date.now().toString().slice(-6)}`; }
function seeded(index, salt = 0) { const value = Math.sin(index * 99991 + salt * 7919) * 10000; return value - Math.floor(value); }
function saleDate(index, count) {
  const start = new Date(2026, 0, 1, 10, 0, 0, 0); const end = new Date(2026, 7, 25, 21, 59, 0, 0);
  const time = start.getTime() + Math.floor((index / Math.max(1, count - 1)) * (end.getTime() - start.getTime()));
  const date = new Date(time); date.setHours(10 + (index * 2 % 12), Math.floor(seeded(index, 2) * 60), 0, 0); return date;
}

export async function resetAndSeed(db, config) {
  if (await db.platformAdmin.count({ where: { username: config.username } })) throw new Error('Owner username conflicts with a platform admin. No data changed.');
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM Restaurant ORDER BY id FOR UPDATE`;
    const removed = { restaurants: await tx.restaurant.count(), employees: await tx.employee.count(), orders: await tx.order.count() };
    await tx.platformLog.deleteMany({ where: { restaurantId: { not: null } } });
    await tx.restaurant.updateMany({ data: { ownerId: null } });
    await tx.order.deleteMany(); await tx.menuItemModifierRecipe.deleteMany(); await tx.recipe.deleteMany();
    await tx.menuItemModifier.deleteMany(); await tx.menuItemModifierGroup.deleteMany(); await tx.menuItem.deleteMany(); await tx.restaurant.deleteMany();

    const approvedAt = new Date(2025, 11, 20, 10, 0, 0);
    const restaurant = await tx.restaurant.create({ data: { name: config.restaurantName, slug: slugFrom(config.restaurantName), approvalStatus: 'APPROVED', reviewedAt: approvedAt, reviewReason: 'ตรวจสอบและอนุมัติแล้ว' } });
    const owner = await tx.employee.create({ data: { restaurantId: restaurant.id, username: config.username, displayName: `เจ้าของร้าน ${config.restaurantName}`, passwordHash: hashPassword(config.password), email: config.email, emailVerifiedAt: approvedAt, emailVerificationRequired: false, roles: { create: { role: 'OWNER' } } } });
    await tx.restaurant.update({ where: { id: restaurant.id }, data: { ownerId: owner.id } });
    await tx.auditLog.createMany({ data: [
      { restaurantId: restaurant.id, employeeId: owner.id, action: 'REGISTER_RESTAURANT', entityType: 'Restaurant', entityId: String(restaurant.id), details: { restaurantName: config.restaurantName, username: config.username, displayName: owner.displayName }, createdAt: approvedAt },
      { restaurantId: restaurant.id, employeeId: owner.id, action: 'VERIFY_EMAIL', entityType: 'Employee', entityId: String(owner.id), createdAt: approvedAt },
    ] });
    const admin = await tx.platformAdmin.findFirst({ where: { active: true }, orderBy: { id: 'asc' }, select: { id: true, displayName: true } });
    await tx.platformLog.create({ data: { adminId: admin?.id, actorName: admin?.displayName || 'ผู้ดูแล PromRaan', action: 'RESTAURANT_APPROVED', restaurantId: restaurant.id, createdAt: approvedAt, details: { restaurantName: config.restaurantName, reason: 'ตรวจสอบและอนุมัติแล้ว' } } });
    await tx.paymentSettings.create({ data: { restaurantId: restaurant.id, promptPayEnabled: false } });

    const categories = {};
    for (const name of ['อาหารจานเดียว', 'เครื่องดื่ม']) categories[name] = await tx.category.create({ data: { restaurantId: restaurant.id, name } });
    const ingredients = {};
    for (const [name, unit, minStock, costPerUnit] of INGREDIENTS) ingredients[name] = await tx.ingredient.create({ data: { restaurantId: restaurant.id, name, unit, stock: 10000000, minStock, costPerUnit } });
    const menus = [];
    for (const [sku, name, price, category, recipe] of MENUS) {
      const menu = await tx.menuItem.create({ data: { restaurantId: restaurant.id, categoryId: categories[category].id, sku, name, description: name, price, saleUnit: sku.startsWith('DRINK-') ? 'ชิ้น' : 'จาน', recipes: { create: recipe.map(([ingredient, quantity]) => ({ ingredientId: ingredients[ingredient].id, quantity })) } } });
      menus.push({ id: menu.id, sku, name, price, recipe });
    }
    const tables = [];
    for (let i = 1; i <= 8; i++) tables.push(await tx.restaurantTable.create({ data: { restaurantId: restaurant.id, name: `โต๊ะ ${i}`, seats: i <= 4 ? 2 : 4 } }));
    for (const ingredient of Object.values(ingredients)) await tx.stockMovement.create({ data: { restaurantId: restaurant.id, ingredientId: ingredient.id, type: 'STOCK_IN', quantity: 10000000, reference: 'OPENING-BALANCE', note: 'ยอดยกมา', createdAt: approvedAt } });

    for (let index = 0; index < config.salesCount; index++) {
      const paidAt = saleDate(index, config.salesCount); const lineCount = 2 + Math.floor(seeded(index, 3) * 3); const lines = []; const used = new Map();
      for (let line = 0; line < lineCount; line++) {
        const menu = menus[Math.floor(seeded(index, line + 10) * menus.length)]; const qty = seeded(index, line + 30) > 0.82 ? 2 : 1;
        lines.push({ menu, qty }); for (const [name, quantity] of menu.recipe) used.set(name, (used.get(name) || 0) + quantity * qty);
      }
      const subtotal = lines.reduce((sum, row) => sum + row.menu.price * row.qty, 0); const method = seeded(index, 50) > 0.42 ? 'PROMPTPAY' : 'CASH'; const type = seeded(index, 51) > 0.3 ? 'DINE_IN' : 'TAKEAWAY';
      const y = String(paidAt.getFullYear()).slice(-2), m = String(paidAt.getMonth() + 1).padStart(2, '0'), d = String(paidAt.getDate()).padStart(2, '0'), seq = String(index + 1).padStart(5, '0');
      const orderNumber = `ORD-${y}${m}${d}-${seq}`; const received = method === 'CASH' && seeded(index, 52) > 0.6 ? subtotal + 100 : subtotal;
      const order = await tx.order.create({ data: { restaurantId: restaurant.id, orderNumber, tableId: type === 'DINE_IN' ? tables[index % tables.length].id : null, type, queueNumber: type === 'TAKEAWAY' ? `Q-${seq}` : null, status: 'SERVED', paymentStatus: 'PAID', subtotal, discount: 0, total: subtotal, stockDeducted: true, createdAt: paidAt, updatedAt: paidAt, pickedUpAt: type === 'TAKEAWAY' ? paidAt : null,
        items: { create: lines.map(row => ({ menuItemId: row.menu.id, name: row.menu.name, price: row.menu.price, qty: row.qty, status: 'SERVED', source: 'STAFF', createdAt: paidAt, updatedAt: paidAt })) },
        payment: { create: { restaurantId: restaurant.id, method, amount: subtotal, receivedAmount: received, changeAmount: received - subtotal, paidAt } } }, include: { items: true, payment: true } });
      for (const [name, quantity] of used) { await tx.ingredient.update({ where: { id: ingredients[name].id }, data: { stock: { decrement: quantity } } }); await tx.stockMovement.create({ data: { restaurantId: restaurant.id, ingredientId: ingredients[name].id, type: 'STOCK_OUT', quantity, reference: orderNumber, note: 'ตัดจากออเดอร์', createdAt: paidAt } }); }
      const details = { snapshotVersion: 1, actorName: owner.displayName, orderNumber, type, subtotal, discount: 0, total: subtotal, itemCount: lines.reduce((sum,row)=>sum+row.qty,0), items: lines.map(row=>({name:row.menu.name,qty:row.qty,price:row.menu.price})) };
      await tx.auditLog.createMany({ data: [
        { restaurantId: restaurant.id, employeeId: owner.id, action: 'CREATE_ORDER', requestId: randomUUID(), entityType: 'Order', entityId: String(order.id), details, createdAt: paidAt },
        { restaurantId: restaurant.id, employeeId: owner.id, action: 'PAY_ORDER', requestId: randomUUID(), entityType: 'Order', entityId: String(order.id), details: { ...details, paymentId: order.payment.id, method, receivedAmount: received, changeAmount: received - subtotal }, createdAt: paidAt },
      ] });
    }
    for (const [name,,,,finalStock] of INGREDIENTS) { const current = await tx.ingredient.findUniqueOrThrow({ where: { id: ingredients[name].id } }); const quantity = finalStock - current.stock; await tx.ingredient.update({ where: { id: current.id }, data: { stock: finalStock } }); await tx.stockMovement.create({ data: { restaurantId: restaurant.id, ingredientId: current.id, type: 'ADJUSTMENT', quantity, reference: 'STOCK-BALANCE', note: 'ปรับยอดคงเหลือ', createdAt: new Date(2026, 7, 25, 23, 0, 0) } }); }
    return { removed, restaurant: config.restaurantName, ownerUsername: config.username, menus: menus.length, ingredients: Object.keys(ingredients).length, tables: tables.length, orders: config.salesCount };
  }, { timeout: 180000 });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const db = new PrismaClient();
  try {
    const url = new URL(process.env.DATABASE_URL); const database = decodeURIComponent(url.pathname.slice(1));
    if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1'].includes(url.hostname) || database !== 'restaurant_system') throw new Error('Reset is restricted to local restaurant_system only.');
    const currentOwner = await db.employee.findFirst({ where: { roles: { some: { role: 'OWNER' } } }, select: { email: true } });
    const config = validateConfig(process.env, currentOwner?.email);
    console.log({ database, restaurantsToRemove: await db.restaurant.count(), ordersToRemove: await db.order.count(), result: `one approved restaurant, one verified owner, and ${config.salesCount} paid orders`, preserve: 'Platform admins, sessions, settings, system-level history, and media files' });
    if (!process.argv.includes('--apply')) console.log('Preview only. To replace local shop data, use --apply --confirm-database=restaurant_system');
    else { if (!process.argv.includes('--confirm-database=restaurant_system')) throw new Error('Missing explicit database confirmation.'); console.log(await resetAndSeed(db, config)); console.log('The owner can sign in immediately.'); }
  } catch (error) { console.error(error?.code ? `Database operation failed (${error.code}); transaction rolled back if reset began.` : error.message); process.exitCode = 1; }
  finally { await db.$disconnect(); }
}
