const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("node:crypto");

const prisma = new PrismaClient();

const categoriesSeed = ["อาหารจานเดียว", "เครื่องดื่ม"];

const menuSeed = [
  { sku: "KAPRAO-CHK", name: "ข้าวกะเพราไก่", description: "กะเพราไก่สับราดข้าว", price: 65, saleUnit: "จาน", category: "อาหารจานเดียว" },
  { sku: "KAPRAO-PORK", name: "ข้าวกะเพราหมูสับ", description: "กะเพราหมูสับราดข้าว", price: 70, saleUnit: "จาน", category: "อาหารจานเดียว" },
  { sku: "KAPRAO-CRISPY", name: "ข้าวกะเพราหมูกรอบ", description: "กะเพราหมูกรอบราดข้าว", price: 85, saleUnit: "จาน", category: "อาหารจานเดียว" },
  { sku: "KAPRAO-SEAFOOD", name: "ข้าวกะเพราทะเล", description: "กะเพรากุ้งและปลาหมึกราดข้าว", price: 90, saleUnit: "จาน", category: "อาหารจานเดียว" },
  { sku: "FRIEDRICE-CHK", name: "ข้าวผัดไก่", description: "ข้าวผัดไก่ใส่ไข่ หอมกระทะ", price: 70, saleUnit: "จาน", category: "อาหารจานเดียว" },
  { sku: "FRIEDRICE-PORK", name: "ข้าวผัดหมู", description: "ข้าวผัดหมูใส่ไข่ หอมกระทะ", price: 75, saleUnit: "จาน", category: "อาหารจานเดียว" },
  { sku: "FRIEDRICE-CRISPY", name: "ข้าวผัดหมูกรอบ", description: "ข้าวผัดหมูกรอบใส่ไข่", price: 90, saleUnit: "จาน", category: "อาหารจานเดียว" },
  { sku: "FRIEDRICE-SEAFOOD", name: "ข้าวผัดทะเล", description: "ข้าวผัดกุ้งและปลาหมึกใส่ไข่", price: 95, saleUnit: "จาน", category: "อาหารจานเดียว" },
  { sku: "OMELETTE", name: "ข้าวไข่เจียว", description: "ไข่เจียวราดข้าว", price: 55, saleUnit: "จาน", category: "อาหารจานเดียว" },
  { sku: "OMELETTE-PORK", name: "ข้าวไข่เจียวหมูสับ", description: "ไข่เจียวหมูสับราดข้าว", price: 65, saleUnit: "จาน", category: "อาหารจานเดียว" },
  { sku: "OMELETTE-SHRIMP", name: "ข้าวไข่เจียวกุ้งสับ", description: "ไข่เจียวกุ้งสับราดข้าว", price: 75, saleUnit: "จาน", category: "อาหารจานเดียว" },
  { sku: "DRINK-WATER", name: "น้ำเปล่า", description: "น้ำดื่ม 600 มล.", price: 15, saleUnit: "ขวด", category: "เครื่องดื่ม" },
  { sku: "DRINK-COLA", name: "โค้ก", description: "โค้กกระป๋อง 325 มล.", price: 25, saleUnit: "กระป๋อง", category: "เครื่องดื่ม" },
];

const retiredSampleSkus = [
  "FOOD-001",
  "FOOD-002",
  "FOOD-003",
  "FOOD-004",
  "RICE-001",
  "RICE-002",
  "RICE-003",
  "RICE-004",
  "RICE-005",
  "RICE-006",
  "SIDE-001",
  "SIDE-002",
  "SIDE-003",
  "SIDE-004",
  "SNACK-001",
  "SNACK-002",
  "DRINK-001",
  "DRINK-002",
  "DRINK-003",
  "DRINK-004",
  "DESSERT-001",
  "DESSERT-002",
];

const ingredientSeed = [
  { name: "ข้าวสาร", unit: "กรัม", stock: 360000, minStock: 50000, costPerUnit: 0.045 },
  { name: "เนื้อไก่", unit: "กรัม", stock: 130000, minStock: 18000, costPerUnit: 0.095 },
  { name: "หมูสับ", unit: "กรัม", stock: 130000, minStock: 18000, costPerUnit: 0.14 },
  { name: "หมูกรอบ", unit: "กรัม", stock: 90000, minStock: 12000, costPerUnit: 0.22 },
  { name: "กุ้ง", unit: "กรัม", stock: 70000, minStock: 9000, costPerUnit: 0.36 },
  { name: "ปลาหมึก", unit: "กรัม", stock: 70000, minStock: 9000, costPerUnit: 0.28 },
  { name: "ไข่ไก่", unit: "ฟอง", stock: 2500, minStock: 300, costPerUnit: 4 },
  { name: "ใบกะเพรา", unit: "กรัม", stock: 18000, minStock: 2500, costPerUnit: 0.12 },
  { name: "กระเทียม", unit: "กรัม", stock: 22000, minStock: 3000, costPerUnit: 0.09 },
  { name: "พริกสด", unit: "กรัม", stock: 15000, minStock: 2000, costPerUnit: 0.1 },
  { name: "ซอสปรุงรส", unit: "มล.", stock: 26000, minStock: 4000, costPerUnit: 0.04 },
  { name: "น้ำปลา", unit: "มล.", stock: 18000, minStock: 3000, costPerUnit: 0.035 },
  { name: "น้ำมันพืช", unit: "มล.", stock: 42000, minStock: 6000, costPerUnit: 0.055 },
  { name: "น้ำดื่ม", unit: "ขวด", stock: 900, minStock: 180, costPerUnit: 7 },
  { name: "โค้ก", unit: "กระป๋อง", stock: 600, minStock: 120, costPerUnit: 15 },
];

const recipes = {
  "KAPRAO-CHK": [["ข้าวสาร", 180], ["เนื้อไก่", 110], ["ใบกะเพรา", 12], ["กระเทียม", 8], ["พริกสด", 6], ["ซอสปรุงรส", 15], ["น้ำมันพืช", 18]],
  "KAPRAO-PORK": [["ข้าวสาร", 180], ["หมูสับ", 110], ["ใบกะเพรา", 12], ["กระเทียม", 8], ["พริกสด", 6], ["ซอสปรุงรส", 15], ["น้ำมันพืช", 18]],
  "KAPRAO-CRISPY": [["ข้าวสาร", 180], ["หมูกรอบ", 120], ["ใบกะเพรา", 12], ["กระเทียม", 8], ["พริกสด", 6], ["ซอสปรุงรส", 15], ["น้ำมันพืช", 14]],
  "KAPRAO-SEAFOOD": [["ข้าวสาร", 180], ["กุ้ง", 70], ["ปลาหมึก", 70], ["ใบกะเพรา", 12], ["กระเทียม", 8], ["พริกสด", 6], ["ซอสปรุงรส", 15], ["น้ำมันพืช", 18]],
  "FRIEDRICE-CHK": [["ข้าวสาร", 190], ["เนื้อไก่", 95], ["ไข่ไก่", 1], ["กระเทียม", 6], ["ซอสปรุงรส", 18], ["น้ำมันพืช", 20]],
  "FRIEDRICE-PORK": [["ข้าวสาร", 190], ["หมูสับ", 95], ["ไข่ไก่", 1], ["กระเทียม", 6], ["ซอสปรุงรส", 18], ["น้ำมันพืช", 20]],
  "FRIEDRICE-CRISPY": [["ข้าวสาร", 190], ["หมูกรอบ", 105], ["ไข่ไก่", 1], ["กระเทียม", 6], ["ซอสปรุงรส", 18], ["น้ำมันพืช", 18]],
  "FRIEDRICE-SEAFOOD": [["ข้าวสาร", 190], ["กุ้ง", 65], ["ปลาหมึก", 65], ["ไข่ไก่", 1], ["กระเทียม", 6], ["ซอสปรุงรส", 18], ["น้ำมันพืช", 20]],
  "OMELETTE": [["ข้าวสาร", 180], ["ไข่ไก่", 2], ["น้ำปลา", 8], ["น้ำมันพืช", 22]],
  "OMELETTE-PORK": [["ข้าวสาร", 180], ["ไข่ไก่", 2], ["หมูสับ", 55], ["น้ำปลา", 8], ["น้ำมันพืช", 22]],
  "OMELETTE-SHRIMP": [["ข้าวสาร", 180], ["ไข่ไก่", 2], ["กุ้ง", 60], ["น้ำปลา", 8], ["น้ำมันพืช", 22]],
  "DRINK-WATER": [["น้ำดื่ม", 1]],
  "DRINK-COLA": [["โค้ก", 1]],
};

const specialRecipes = {
  "KAPRAO-CHK": [["ข้าวสาร", 50], ["เนื้อไก่", 45], ["ใบกะเพรา", 4], ["ซอสปรุงรส", 5], ["น้ำมันพืช", 5]],
  "KAPRAO-PORK": [["ข้าวสาร", 50], ["หมูสับ", 45], ["ใบกะเพรา", 4], ["ซอสปรุงรส", 5], ["น้ำมันพืช", 5]],
  "KAPRAO-CRISPY": [["ข้าวสาร", 50], ["หมูกรอบ", 45], ["ใบกะเพรา", 4], ["ซอสปรุงรส", 5], ["น้ำมันพืช", 4]],
  "KAPRAO-SEAFOOD": [["ข้าวสาร", 50], ["กุ้ง", 25], ["ปลาหมึก", 25], ["ใบกะเพรา", 4], ["ซอสปรุงรส", 5], ["น้ำมันพืช", 5]],
  "FRIEDRICE-CHK": [["ข้าวสาร", 55], ["เนื้อไก่", 40], ["ซอสปรุงรส", 5], ["น้ำมันพืช", 5]],
  "FRIEDRICE-PORK": [["ข้าวสาร", 55], ["หมูสับ", 40], ["ซอสปรุงรส", 5], ["น้ำมันพืช", 5]],
  "FRIEDRICE-CRISPY": [["ข้าวสาร", 55], ["หมูกรอบ", 40], ["ซอสปรุงรส", 5], ["น้ำมันพืช", 4]],
  "FRIEDRICE-SEAFOOD": [["ข้าวสาร", 55], ["กุ้ง", 22], ["ปลาหมึก", 22], ["ซอสปรุงรส", 5], ["น้ำมันพืช", 5]],
  "OMELETTE": [["ข้าวสาร", 50], ["ไข่ไก่", 1], ["น้ำมันพืช", 8]],
  "OMELETTE-PORK": [["ข้าวสาร", 50], ["ไข่ไก่", 1], ["หมูสับ", 25], ["น้ำมันพืช", 8]],
  "OMELETTE-SHRIMP": [["ข้าวสาร", 50], ["ไข่ไก่", 1], ["กุ้ง", 25], ["น้ำมันพืช", 8]],
};

async function main() {
  const ownerUsername = process.env.SEED_OWNER_USERNAME;
  const ownerPassword = process.env.SEED_OWNER_PASSWORD;

  if (!ownerUsername || !ownerPassword) {
    throw new Error("กรุณากำหนด SEED_OWNER_USERNAME และ SEED_OWNER_PASSWORD ในไฟล์ .env");
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

  const categories = {};
  for (const name of categoriesSeed) {
    categories[name] = await prisma.category.upsert({
      where: { name },
      update: { active: true },
      create: { name },
    });
  }

  const menuItems = {};
  for (const item of menuSeed) {
    menuItems[item.sku] = await prisma.menuItem.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        description: item.description,
        price: item.price,
        saleUnit: item.saleUnit,
        categoryId: categories[item.category].id,
        available: true,
      },
      create: {
        sku: item.sku,
        name: item.name,
        description: item.description,
        price: item.price,
        saleUnit: item.saleUnit,
        categoryId: categories[item.category].id,
      },
    });
  }
  await prisma.menuItem.updateMany({
    where: { sku: { in: retiredSampleSkus } },
    data: { available: false },
  });

  const ingredients = {};
  for (const item of ingredientSeed) {
    ingredients[item.name] = await prisma.ingredient.upsert({
      where: { name: item.name },
      update: {
        unit: item.unit,
        stock: item.stock,
        minStock: item.minStock,
        costPerUnit: item.costPerUnit,
        active: true,
      },
      create: item,
    });
  }

  for (const [sku, rows] of Object.entries(recipes)) {
    for (const [ingredientName, quantity] of rows) {
      await prisma.recipe.upsert({
        where: { menuItemId_ingredientId: { menuItemId: menuItems[sku].id, ingredientId: ingredients[ingredientName].id } },
        update: { quantity },
        create: { menuItemId: menuItems[sku].id, ingredientId: ingredients[ingredientName].id, quantity },
      });
    }
  }

  for (const sku of Object.keys(specialRecipes)) {
    const extraGroup = await prisma.menuItemModifierGroup.upsert({
      where: { menuItemId_name: { menuItemId: menuItems[sku].id, name: "ตัวเลือกเสริม" } },
      update: { required: false, minSelect: 0, maxSelect: 2, sortOrder: 1 },
      create: { menuItemId: menuItems[sku].id, name: "ตัวเลือกเสริม", required: false, minSelect: 0, maxSelect: 2, sortOrder: 1 },
    });
    const spiceGroup = await prisma.menuItemModifierGroup.upsert({
      where: { menuItemId_name: { menuItemId: menuItems[sku].id, name: "ระดับความเผ็ด" } },
      update: { required: false, minSelect: 0, maxSelect: 1, sortOrder: 2 },
      create: { menuItemId: menuItems[sku].id, name: "ระดับความเผ็ด", required: false, minSelect: 0, maxSelect: 1, sortOrder: 2 },
    });
    const special = await prisma.menuItemModifier.upsert({
      where: { menuItemId_name: { menuItemId: menuItems[sku].id, name: "พิเศษ" } },
      update: { price: 15, active: true },
      create: { menuItemId: menuItems[sku].id, groupId: extraGroup.id, name: "พิเศษ", price: 15 },
    });
    await prisma.menuItemModifier.update({ where: { id: special.id }, data: { groupId: extraGroup.id } });
    for (const [ingredientName, quantity] of specialRecipes[sku]) {
      await prisma.menuItemModifierRecipe.upsert({
        where: { modifierId_ingredientId: { modifierId: special.id, ingredientId: ingredients[ingredientName].id } },
        update: { quantity },
        create: { modifierId: special.id, ingredientId: ingredients[ingredientName].id, quantity },
      });
    }
    for (const spiceName of ["ไม่เผ็ด", "เผ็ดน้อย", "เผ็ดปกติ", "เผ็ดมาก"]) {
      const spice = await prisma.menuItemModifier.upsert({
        where: { menuItemId_name: { menuItemId: menuItems[sku].id, name: spiceName } },
        update: { price: 0, active: true },
        create: { menuItemId: menuItems[sku].id, groupId: spiceGroup.id, name: spiceName, price: 0 },
      });
      await prisma.menuItemModifier.update({ where: { id: spice.id }, data: { groupId: spiceGroup.id } });
    }
  }

  for (const sku of menuSeed.filter((item) => item.category === "อาหารจานเดียว" && !item.sku.startsWith("OMELETTE")).map((item) => item.sku)) {
    const extraGroup = await prisma.menuItemModifierGroup.upsert({
      where: { menuItemId_name: { menuItemId: menuItems[sku].id, name: "ตัวเลือกเสริม" } },
      update: { required: false, minSelect: 0, maxSelect: 2, sortOrder: 1 },
      create: { menuItemId: menuItems[sku].id, name: "ตัวเลือกเสริม", required: false, minSelect: 0, maxSelect: 2, sortOrder: 1 },
    });
    const friedEgg = await prisma.menuItemModifier.upsert({
      where: { menuItemId_name: { menuItemId: menuItems[sku].id, name: "ไข่ดาว" } },
      update: { price: 10, active: true },
      create: { menuItemId: menuItems[sku].id, groupId: extraGroup.id, name: "ไข่ดาว", price: 10 },
    });
    await prisma.menuItemModifier.update({ where: { id: friedEgg.id }, data: { groupId: extraGroup.id } });
    for (const [ingredientName, quantity] of [["ไข่ไก่", 1], ["น้ำมันพืช", 8]]) {
      await prisma.menuItemModifierRecipe.upsert({
        where: { modifierId_ingredientId: { modifierId: friedEgg.id, ingredientId: ingredients[ingredientName].id } },
        update: { quantity },
        create: { modifierId: friedEgg.id, ingredientId: ingredients[ingredientName].id, quantity },
      });
    }
  }

  for (let index = 1; index <= 8; index += 1) {
    await prisma.restaurantTable.upsert({
      where: { name: `โต๊ะ ${index}` },
      update: { seats: index <= 4 ? 2 : 4 },
      create: { name: `โต๊ะ ${index}`, seats: index <= 4 ? 2 : 4 },
    });
  }
}

main()
  .then(() => console.log("Restaurant sample data is ready."))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
