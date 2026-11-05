import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
  const users = await p.user.findMany({
    select: { id: true, name: true, mobile: true, role: true, isActive: true },
    orderBy: { id: 'asc' },
  });
  console.log('USERS:', JSON.stringify(users, null, 1));
  const regs = await p.registration.findMany({
    select: { id: true, ref: true, name: true, mobile: true, designation: true, status: true },
    where: { mobile: '9597831088' },
  });
  console.log('REGS for 9597831088:', JSON.stringify(regs, null, 1));
  const allRegs = await p.registration.findMany({
    select: { id: true, ref: true, name: true, mobile: true, designation: true, status: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log('ALL REGS (recent):', JSON.stringify(allRegs, null, 1));
  await p.$disconnect();
})();
