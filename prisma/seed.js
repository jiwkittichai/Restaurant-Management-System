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

  const categoryNames = ["อาหารจานเดียว", "เมนูกับข้าว", "ทานเล่น", "เครื่องดื่ม", "ของหวาน"];
  const categories = {};
  for (const name of categoryNames) {
    categories[name] = await prisma.category.upsert({
      where: { name }, update: {}, create: { name },
    });
  }

  const menu = [
    { sku: "RICE-001", name: "ข้าวกะเพราไก่ไข่ดาว", description: "กะเพราไก่สับราดข้าว เสิร์ฟพร้อมไข่ดาว", price: 79, saleUnit: "จาน", category: "อาหารจานเดียว" },
    { sku: "RICE-002", name: "ข้าวกะเพราหมูสับไข่ดาว", description: "กะเพราหมูสับราดข้าว เสิร์ฟพร้อมไข่ดาว", price: 85, saleUnit: "จาน", category: "อาหารจานเดียว" },
    { sku: "RICE-003", name: "ข้าวผัดหมู", description: "ข้าวผัดหมูใส่ไข่ หอมกระทะ", price: 75, saleUnit: "จาน", category: "อาหารจานเดียว" },
    { sku: "RICE-004", name: "ข้าวผัดกุ้ง", description: "ข้าวผัดกุ้งใส่ไข่ โรยต้นหอม", price: 95, saleUnit: "จาน", category: "อาหารจานเดียว" },
    { sku: "RICE-005", name: "ข้าวไข่เจียวหมูสับ", description: "ไข่เจียวหมูสับราดข้าว", price: 65, saleUnit: "จาน", category: "อาหารจานเดียว" },
    { sku: "RICE-006", name: "ข้าวไก่กระเทียม", description: "ไก่ผัดกระเทียมพริกไทยราดข้าว", price: 75, saleUnit: "จาน", category: "อาหารจานเดียว" },
    { sku: "SIDE-001", name: "ต้มยำกุ้งน้ำข้น", description: "ต้มยำกุ้งน้ำข้นรสจัดจ้าน", price: 180, saleUnit: "ชาม", category: "เมนูกับข้าว" },
    { sku: "SIDE-002", name: "แกงเขียวหวานไก่", description: "แกงเขียวหวานไก่กะทิหอมเครื่องแกง", price: 150, saleUnit: "ชาม", category: "เมนูกับข้าว" },
    { sku: "SIDE-003", name: "ผัดกะเพราหมูสับ", description: "ผัดกะเพราหมูสับเป็นกับข้าว", price: 120, saleUnit: "จาน", category: "เมนูกับข้าว" },
    { sku: "SIDE-004", name: "ไข่เจียวหมูสับ", description: "ไข่เจียวหมูสับกรอบนอกนุ่มใน", price: 85, saleUnit: "จาน", category: "เมนูกับข้าว" },
    { sku: "SNACK-001", name: "ปีกไก่ทอดน้ำปลา", description: "ปีกไก่ทอดกรอบคลุกน้ำปลา", price: 120, saleUnit: "จาน", category: "ทานเล่น" },
    { sku: "SNACK-002", name: "ลาบหมู", description: "ลาบหมูรสจัด เสิร์ฟพร้อมผักสด", price: 110, saleUnit: "จาน", category: "ทานเล่น" },
    { sku: "DRINK-001", name: "ชาไทยเย็น", description: "ชาไทยหอมเข้ม", price: 45, saleUnit: "แก้ว", category: "เครื่องดื่ม" },
    { sku: "DRINK-002", name: "กาแฟเย็น", description: "กาแฟเย็นหวานมัน", price: 50, saleUnit: "แก้ว", category: "เครื่องดื่ม" },
    { sku: "DRINK-003", name: "น้ำเปล่า", description: "น้ำดื่ม 600 มล.", price: 15, saleUnit: "ขวด", category: "เครื่องดื่ม" },
    { sku: "DRINK-004", name: "โค้ก", description: "โค้กกระป๋อง 325 มล.", price: 25, saleUnit: "กระป๋อง", category: "เครื่องดื่ม" },
    { sku: "DESSERT-001", name: "เฉาก๊วยนมสด", description: "เฉาก๊วยนุ่มกับนมสด", price: 50, saleUnit: "ถ้วย", category: "ของหวาน" },
    { sku: "DESSERT-002", name: "บัวลอยมะพร้าวอ่อน", description: "บัวลอยน้ำกะทิ ใส่มะพร้าวอ่อน", price: 55, saleUnit: "ถ้วย", category: "ของหวาน" },
  ];
  const menuItems = {};
  for (const item of menu) {
    menuItems[item.sku] = await prisma.menuItem.upsert({
      where: { sku: item.sku },
      update: { name: item.name, description: item.description, price: item.price, saleUnit: item.saleUnit, categoryId: categories[item.category].id, available: true },
      create: { sku: item.sku, name: item.name, description: item.description, price: item.price, saleUnit: item.saleUnit, categoryId: categories[item.category].id },
    });
  }

  const ingredientData = [
    { name: "ข้าวสาร", unit: "กรัม", stock: 160000, minStock: 25000, costPerUnit: 0.045 },
    { name: "เนื้อไก่", unit: "กรัม", stock: 90000, minStock: 12000, costPerUnit: 0.095 },
    { name: "หมูสับ", unit: "กรัม", stock: 85000, minStock: 12000, costPerUnit: 0.14 },
    { name: "กุ้ง", unit: "กรัม", stock: 35000, minStock: 5000, costPerUnit: 0.36 },
    { name: "ปีกไก่", unit: "กรัม", stock: 38000, minStock: 6000, costPerUnit: 0.12 },
    { name: "ไข่ไก่", unit: "ฟอง", stock: 1500, minStock: 180, costPerUnit: 4 },
    { name: "ใบกะเพรา", unit: "กรัม", stock: 8000, minStock: 1000, costPerUnit: 0.12 },
    { name: "กระเทียม", unit: "กรัม", stock: 12000, minStock: 1500, costPerUnit: 0.09 },
    { name: "พริกสด", unit: "กรัม", stock: 7000, minStock: 900, costPerUnit: 0.1 },
    { name: "น้ำปลา", unit: "มล.", stock: 12000, minStock: 1800, costPerUnit: 0.035 },
    { name: "ซอสปรุงรส", unit: "มล.", stock: 10000, minStock: 1500, costPerUnit: 0.04 },
    { name: "น้ำมันพืช", unit: "มล.", stock: 18000, minStock: 2500, costPerUnit: 0.055 },
    { name: "เครื่องต้มยำ", unit: "กรัม", stock: 6500, minStock: 900, costPerUnit: 0.12 },
    { name: "กะทิ", unit: "มล.", stock: 60000, minStock: 8000, costPerUnit: 0.065 },
    { name: "เครื่องแกงเขียวหวาน", unit: "กรัม", stock: 6000, minStock: 800, costPerUnit: 0.15 },
    { name: "ผักสด", unit: "กรัม", stock: 18000, minStock: 2500, costPerUnit: 0.055 },
    { name: "ข้าวคั่ว", unit: "กรัม", stock: 3500, minStock: 500, costPerUnit: 0.08 },
    { name: "ใบชาไทย", unit: "กรัม", stock: 5500, minStock: 700, costPerUnit: 0.25 },
    { name: "ผงกาแฟ", unit: "กรัม", stock: 4200, minStock: 600, costPerUnit: 0.32 },
    { name: "นมสด", unit: "มล.", stock: 28000, minStock: 4000, costPerUnit: 0.05 },
    { name: "นมข้นหวาน", unit: "มล.", stock: 20000, minStock: 3000, costPerUnit: 0.045 },
    { name: "น้ำตาล", unit: "กรัม", stock: 25000, minStock: 4000, costPerUnit: 0.03 },
    { name: "น้ำดื่ม", unit: "ขวด", stock: 720, minStock: 120, costPerUnit: 7 },
    { name: "โค้ก", unit: "กระป๋อง", stock: 360, minStock: 72, costPerUnit: 15 },
    { name: "เฉาก๊วย", unit: "กรัม", stock: 12000, minStock: 1500, costPerUnit: 0.08 },
    { name: "แป้งบัวลอย", unit: "กรัม", stock: 9000, minStock: 1200, costPerUnit: 0.07 },
    { name: "มะพร้าวอ่อน", unit: "กรัม", stock: 8500, minStock: 1200, costPerUnit: 0.11 },
  ];
  const ingredients = {};
  for (const item of ingredientData) {
    ingredients[item.name] = await prisma.ingredient.upsert({
      where: { name: item.name },
      update: { unit: item.unit, stock: item.stock, minStock: item.minStock, costPerUnit: item.costPerUnit, active: true },
      create: item,
    });
  }

  const recipes = {
    "RICE-001": [["ข้าวสาร", 180], ["เนื้อไก่", 110], ["ไข่ไก่", 1], ["ใบกะเพรา", 12], ["กระเทียม", 8], ["พริกสด", 6], ["ซอสปรุงรส", 15], ["น้ำมันพืช", 18]],
    "RICE-002": [["ข้าวสาร", 180], ["หมูสับ", 110], ["ไข่ไก่", 1], ["ใบกะเพรา", 12], ["กระเทียม", 8], ["พริกสด", 6], ["ซอสปรุงรส", 15], ["น้ำมันพืช", 18]],
    "RICE-003": [["ข้าวสาร", 190], ["หมูสับ", 90], ["ไข่ไก่", 1], ["กระเทียม", 6], ["ซอสปรุงรส", 18], ["น้ำมันพืช", 20]],
    "RICE-004": [["ข้าวสาร", 190], ["กุ้ง", 110], ["ไข่ไก่", 1], ["กระเทียม", 6], ["ซอสปรุงรส", 18], ["น้ำมันพืช", 20]],
    "RICE-005": [["ข้าวสาร", 180], ["ไข่ไก่", 2], ["หมูสับ", 45], ["น้ำปลา", 8], ["น้ำมันพืช", 20]],
    "RICE-006": [["ข้าวสาร", 180], ["เนื้อไก่", 120], ["กระเทียม", 14], ["ซอสปรุงรส", 18], ["น้ำมันพืช", 18]],
    "SIDE-001": [["กุ้ง", 180], ["เครื่องต้มยำ", 45], ["กะทิ", 180], ["น้ำปลา", 15], ["พริกสด", 8]],
    "SIDE-002": [["เนื้อไก่", 180], ["กะทิ", 260], ["เครื่องแกงเขียวหวาน", 45], ["ผักสด", 80], ["น้ำปลา", 12]],
    "SIDE-003": [["หมูสับ", 180], ["ใบกะเพรา", 20], ["กระเทียม", 12], ["พริกสด", 10], ["ซอสปรุงรส", 25], ["น้ำมันพืช", 22]],
    "SIDE-004": [["ไข่ไก่", 3], ["หมูสับ", 70], ["น้ำปลา", 8], ["น้ำมันพืช", 22]],
    "SNACK-001": [["ปีกไก่", 260], ["น้ำปลา", 18], ["กระเทียม", 10], ["น้ำมันพืช", 25]],
    "SNACK-002": [["หมูสับ", 160], ["ข้าวคั่ว", 18], ["น้ำปลา", 12], ["พริกสด", 8], ["ผักสด", 80]],
    "DRINK-001": [["ใบชาไทย", 18], ["นมสด", 80], ["นมข้นหวาน", 45], ["น้ำตาล", 18]],
    "DRINK-002": [["ผงกาแฟ", 16], ["นมสด", 70], ["นมข้นหวาน", 45], ["น้ำตาล", 16]],
    "DRINK-003": [["น้ำดื่ม", 1]],
    "DRINK-004": [["โค้ก", 1]],
    "DESSERT-001": [["เฉาก๊วย", 110], ["นมสด", 100], ["นมข้นหวาน", 25], ["น้ำตาล", 15]],
    "DESSERT-002": [["แป้งบัวลอย", 90], ["กะทิ", 160], ["มะพร้าวอ่อน", 70], ["น้ำตาล", 25]],
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
