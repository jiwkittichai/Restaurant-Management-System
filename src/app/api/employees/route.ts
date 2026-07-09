import { NextRequest, NextResponse } from "next/server";
import { StaffRole } from "@prisma/client";
import { authorizeApi, writeAudit } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const allowedRoles = Object.values(StaffRole);

function normalizeRoles(value: unknown): StaffRole[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((role): role is StaffRole => allowedRoles.includes(role as StaffRole)))];
}

export async function GET() {
  const auth = await authorizeApi([StaffRole.OWNER]);
  if ("response" in auth) return auth.response;
  const [employees, recentAudits] = await Promise.all([
    prisma.employee.findMany({
      select: { id:true, username:true, displayName:true, active:true, lastLoginAt:true, createdAt:true, roles:{select:{role:true}} },
      orderBy: { createdAt: "asc" },
    }),
    prisma.auditLog.findMany({
      take: 20, orderBy: { createdAt: "desc" },
      include: { employee: { select: { displayName:true } } },
    }),
  ]);
  return NextResponse.json({ employees: employees.map(item=>({...item,roles:item.roles.map(role=>role.role)})), recentAudits });
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
      data: { username, displayName, passwordHash:await hashPassword(password), roles:{create:roles.map(role=>({role}))} },
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
    const current = await prisma.employee.findUniqueOrThrow({where:{id},include:{roles:true}});
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
    await writeAudit(auth.user.id,"UPDATE_EMPLOYEE","Employee",id,{previousName:current.displayName,roles:roles||current.roles.map(item=>item.role),active:employee.active,passwordReset:Boolean(password)});
    return NextResponse.json({success:true});
  } catch {
    return NextResponse.json({error:"อัปเดตบัญชีพนักงานไม่สำเร็จ"},{status:409});
  }
}
