import { NextRequest, NextResponse } from "next/server";
import { Prisma, StaffRole } from "@prisma/client";
import { authorizeApi, writeAudit } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const allowedRoles = Object.values(StaffRole);
const internalAuditActions = ["UPDATE_KITCHEN_STATUS"];
const billActions = ["CREATE_ORDER", "ADD_ORDER_ITEMS", "PAY_ORDER", "PAY_ORDER_STRIPE", "PICKUP_ORDER"];


function isJsonObject(value: unknown): value is Prisma.JsonObject {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeRoles(value: unknown): StaffRole[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((role): role is StaffRole => allowedRoles.includes(role as StaffRole)))];
}

export async function GET() {
  const auth = await authorizeApi([StaffRole.OWNER]);
  if ("response" in auth) return auth.response;
  const [employees, recentAudits] = await Promise.all([
    prisma.employee.findMany({
      where: { restaurantId: auth.user.restaurantId },
      select: { id:true, username:true, displayName:true, active:true, lastLoginAt:true, createdAt:true, roles:{select:{role:true}} },
      orderBy: { createdAt: "asc" },
    }),
    prisma.auditLog.findMany({
      where: { restaurantId: auth.user.restaurantId, action: { notIn: internalAuditActions } },
      take: 20, orderBy: { createdAt: "desc" },
      include: { employee: { select: { displayName:true } } },
    }),
  ]);
  const paymentOrderIds = [
    ...new Set(
      recentAudits
        .filter((audit) => billActions.includes(audit.action))
        .map((audit) => Number(audit.entityId))
        .filter((id) => Number.isInteger(id)),
    ),
  ];
  const billOrders = paymentOrderIds.length
    ? await prisma.order.findMany({
        where: { restaurantId: auth.user.restaurantId, id: { in: paymentOrderIds } },
        select: {
          id: true,
          orderNumber: true,
          subtotal: true,
          discount: true,
          total: true,
          table: { select: { name: true } },
          queueNumber: true,
          items: {
            orderBy: { id: "asc" },
            select: {
              id: true,
              name: true,
              qty: true,
              price: true,
              note: true,
              modifiers: {
                orderBy: { id: "asc" },
                select: { id: true, name: true, price: true },
              },
            },
          },
        },
      })
    : [];
  const billOrderById = new Map(billOrders.map((order) => [order.id, order]));
  const enrichedRecentAudits = recentAudits.map((audit) => {
    if (!billActions.includes(audit.action)) return audit;
    const order = billOrderById.get(Number(audit.entityId));
    if (!order) return audit;
    const details = isJsonObject(audit.details) ? audit.details : {};
    return {
      ...audit,
      details: {
        ...details,
        orderNumber: details.orderNumber ?? order.orderNumber,
        subtotal: details.subtotal ?? order.subtotal,
        discount: details.discount ?? order.discount,
        total: details.total ?? order.total,
        tableName: details.tableName ?? order.table?.name,
        queueNumber: details.queueNumber ?? order.queueNumber,
        items: details.items ?? order.items,
        itemCount: details.itemCount ?? order.items.reduce((sum, item) => sum + item.qty, 0),
      },
    };
  });
  return NextResponse.json({ employees: employees.map(item=>({...item,roles:item.roles.map(role=>role.role)})), recentAudits: enrichedRecentAudits });
}

export async function POST(req: NextRequest) {
  const auth = await authorizeApi([StaffRole.OWNER]);
  if ("response" in auth) return auth.response;
  try {
    const body = await req.json();
    const username = String(body.username||"").trim().toLowerCase();
    const displayName = String(body.displayName||"").trim();
    const password = String(body.password||"");
    const roles = normalizeRoles(body.roles);
    if (!/^[a-z0-9._-]{3,30}$/.test(username) || !displayName || password.length < 8 || !roles.length) {
      return NextResponse.json({ error:"กรุณากรอกชื่อผู้ใช้ ชื่อพนักงาน รหัสผ่านอย่างน้อย 8 ตัว และเลือกบทบาท" }, { status:400 });
    }
    const employee = await prisma.employee.create({
      data: { restaurantId: auth.user.restaurantId, username, displayName, passwordHash:await hashPassword(password), roles:{create:roles.map(role=>({role}))} },
      select: { id:true, username:true, displayName:true },
    });
    await writeAudit(auth.user.id,"CREATE_EMPLOYEE","Employee",employee.id,{username,displayName,roles});
    return NextResponse.json(employee,{status:201});
  } catch {
    return NextResponse.json({ error:"สร้างบัญชีไม่สำเร็จ กรุณาตรวจสอบว่าชื่อผู้ใช้ไม่ซ้ำ" }, { status:409 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authorizeApi([StaffRole.OWNER]);
  if ("response" in auth) return auth.response;
  try {
    const body = await req.json();
    const id = Number(body.id);
    const current = await prisma.employee.findFirstOrThrow({where:{id, restaurantId: auth.user.restaurantId},include:{roles:true}});
    const currentRoles = current.roles.map(item=>item.role);
    const roles = body.roles === undefined ? null : normalizeRoles(body.roles);
    if (roles && !roles.length) return NextResponse.json({error:"พนักงานต้องมีอย่างน้อยหนึ่งบทบาท"},{status:400});
    if (id===auth.user.id && (body.active===false || (roles && !roles.includes(StaffRole.OWNER)))) {
      return NextResponse.json({error:"ไม่สามารถระงับหรือนำสิทธิ์เจ้าของร้านออกจากบัญชีที่กำลังใช้งาน"},{status:400});
    }
    const password = body.password ? String(body.password) : "";
    if (password && password.length<8) return NextResponse.json({error:"รหัสผ่านต้องมีอย่างน้อย 8 ตัว"},{status:400});
    const data: {displayName?:string;active?:boolean;passwordHash?:string} = {};
    if (body.displayName!==undefined) data.displayName=String(body.displayName).trim();
    if (body.active!==undefined) data.active=Boolean(body.active);
    if (password) data.passwordHash=await hashPassword(password);
    const employee = await prisma.$transaction(async tx=>{
      const updated=await tx.employee.update({where:{id},data});
      if(roles){await tx.employeeRole.deleteMany({where:{employeeId:id}});await tx.employeeRole.createMany({data:roles.map(role=>({employeeId:id,role}))});}
      if(body.active===false)await tx.authSession.deleteMany({where:{employeeId:id}});
      return updated;
    });
    await writeAudit(auth.user.id,"UPDATE_EMPLOYEE","Employee",id,{
      targetName: employee.displayName,
      before: { displayName: current.displayName, roles: currentRoles, active: current.active },
      after: { displayName: employee.displayName, roles: roles||currentRoles, active: employee.active },
      passwordReset:Boolean(password),
    });
    return NextResponse.json({success:true});
  } catch {
    return NextResponse.json({error:"อัปเดตบัญชีพนักงานไม่สำเร็จ"},{status:409});
  }
}
