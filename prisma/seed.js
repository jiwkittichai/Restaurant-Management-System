const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("node:crypto");

const prisma = new PrismaClient();

async function main() {
  const ownerUsername = process.env.SEED_OWNER_USERNAME;
  const ownerPassword = process.env.SEED_OWNER_PASSWORD;

  if (!ownerUsername || !ownerPassword) {
    throw new Error(
      "กรุณากำหนด SEED_OWNER_USERNAME และ SEED_OWNER_PASSWORD ในไฟล์ .env",
    );
  }
  const existingOwner = await prisma.employee.findUnique({ where: { username: ownerUsername } });
  const salt = randomBytes(16).toString("hex");
  const passwordHash = `scrypt$${salt}$${scryptSync(ownerPassword, salt, 64).toString("hex")}`;
  const owner = existingOwner || await prisma.employee.create({
    data: { username: ownerUsername, displayName: "เจ้าของร้าน", passwordHash },
  });
  await prisma.employeeRole.upsert({
    where: { employeeId_role: { employeeId: owner.id, role: "OWNER" } },
    update: {},
    create: { employeeId: owner.id, role: "OWNER" },
  });

  const categoryNames = ["อาหารจานเดียว", "เมนูกับข้าว", "เครื่องดื่ม", "ของหวาน"];
  const categories = {};
  for (const name of categoryNames) {
    categories[name] = await prisma.category.upsert({
      where: { name }, update: {}, create: { name },
    });
  }

  const menu = [
    { sku: "FOOD-001", name: "ข้าวกะเพราไก่", description: "กะเพราไก่ราดข้าว", price: 65, saleUnit: "จาน", category: "อาหารจานเดียว" },
    { sku: "FOOD-002", name: "ข้าวผัดหมู", description: "ข้าวผัดหมูใส่ไข่", price: 70, saleUnit: "จาน", category: "อาหารจานเดียว" },
    { sku: "FOOD-003", name: "ต้มยำกุ้ง", description: "ต้มยำกุ้งน้ำข้น", price: 160, saleUnit: "ชาม", category: "เมนูกับข้าว" },
    { sku: "FOOD-004", name: "ไข่เจียวหมูสับ", description: "ไข่เจียวหมูสับกรอบนอกนุ่มใน", price: 80, saleUnit: "จาน", category: "เมนูกับข้าว" },
    { sku: "DRINK-001", name: "ชาไทยเย็น", description: "ชาไทยหอมเข้ม", price: 45, saleUnit: "แก้ว", category: "เครื่องดื่ม" },
    { sku: "DRINK-002", name: "น้ำเปล่า", description: "น้ำดื่ม 600 มล.", price: 15, saleUnit: "ขวด", category: "เครื่องดื่ม" },
    { sku: "DESSERT-001", name: "เฉาก๊วยนมสด", description: "เฉาก๊วยนุ่มกับนมสด", price: 50, saleUnit: "ถ้วย", category: "ของหวาน" },
  ];
  const menuItems = {};
  for (const item of menu) {
    menuItems[item.sku] = await prisma.menuItem.upsert({
      where: { sku: item.sku },
      update: { name: item.name, description: item.description, price: item.price, saleUnit: item.saleUnit, categoryId: categories[item.category].id },
      create: { sku: item.sku, name: item.name, description: item.description, price: item.price, saleUnit: item.saleUnit, categoryId: categories[item.category].id },
    });
  }

  const ingredientData = [
    { name: "ข้าวสาร", unit: "กรัม", stock: 10000, minStock: 2000, costPerUnit: 0.04 },
    { name: "เนื้อไก่", unit: "กรัม", stock: 5000, minStock: 1000, costPerUnit: 0.12 },
    { name: "เนื้อหมู", unit: "กรัม", stock: 5000, minStock: 1000, costPerUnit: 0.15 },
    { name: "กุ้ง", unit: "กรัม", stock: 3000, minStock: 500, costPerUnit: 0.35 },
    { name: "ไข่ไก่", unit: "ฟอง", stock: 100, minStock: 20, costPerUnit: 4 },
    { name: "ใบกะเพรา", unit: "กรัม", stock: 500, minStock: 100, costPerUnit: 0.1 },
    { name: "ใบชาไทย", unit: "กรัม", stock: 1000, minStock: 200, costPerUnit: 0.25 },
    { name: "นมสด", unit: "มล.", stock: 5000, minStock: 1000, costPerUnit: 0.05 },
    { name: "น้ำตาล", unit: "กรัม", stock: 5000, minStock: 1000, costPerUnit: 0.03 },
    { name: "น้ำดื่ม", unit: "ขวด", stock: 48, minStock: 12, costPerUnit: 7 },
    { name: "เฉาก๊วย", unit: "กรัม", stock: 2000, minStock: 400, costPerUnit: 0.08 },
  ];
  const ingredients = {};
  for (const item of ingredientData) {
    ingredients[item.name] = await prisma.ingredient.upsert({
      where: { name: item.name },
      update: { unit: item.unit, minStock: item.minStock, costPerUnit: item.costPerUnit },
      create: item,
    });
  }

  const recipes = {
    "FOOD-001": [["ข้าวสาร", 200], ["เนื้อไก่", 120], ["ใบกะเพรา", 10]],
    "FOOD-002": [["ข้าวสาร", 200], ["เนื้อหมู", 100], ["ไข่ไก่", 1]],
    "FOOD-003": [["กุ้ง", 200], ["นมสด", 100]],
    "FOOD-004": [["ไข่ไก่", 3], ["เนื้อหมู", 80]],
    "DRINK-001": [["ใบชาไทย", 15], ["นมสด", 80], ["น้ำตาล", 30]],
    "DRINK-002": [["น้ำดื่ม", 1]],
    "DESSERT-001": [["เฉาก๊วย", 100], ["นมสด", 100], ["น้ำตาล", 20]],
  };
  for (const [sku, rows] of Object.entries(recipes)) {
    for (const [ingredientName, quantity] of rows) {
      await prisma.recipe.upsert({
        where: { menuItemId_ingredientId: { menuItemId: menuItems[sku].id, ingredientId: ingredients[ingredientName].id } },
        update: { quantity },
        create: { menuItemId: menuItems[sku].id, ingredientId: ingredients[ingredientName].id, quantity },
      });
    }
  }

  for (let index = 1; index <= 8; index += 1) {
    await prisma.restaurantTable.upsert({
      where: { name: `โต๊ะ ${index}` }, update: {}, create: { name: `โต๊ะ ${index}`, seats: index <= 4 ? 2 : 4 },
    });
  }
}

main()
  .then(() => console.log("Restaurant sample data is ready."))
  .finally(() => prisma.$disconnect());
