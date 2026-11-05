import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const defaultBranches = [
  'BANGALORE - HEAD OFFICE (MAHALAKSHMI LAYOUT)',
  'BANGALORE - YESHWANTHPUR BRANCH',
  'BANGALORE - RAJAJINAGAR BRANCH',
  'BANGALORE - PEENYA INDUSTRIAL AREA',
  'BANGALORE - ELECTRONIC CITY',
  'MYSORE - CITY BRANCH',
  'HUBLI - DHARWAD REGIONAL BRANCH',
  'MANGALORE - COASTAL BRANCH',
  'BELGAUM - NORTH KARNATAKA BRANCH',
];

async function seed() {
  await prisma.branch.createMany({
    data: defaultBranches.map((name) => ({ name })),
    skipDuplicates: true,
  });

  const adminMobile = process.env.ADMIN_MOBILE || '9080356538';
  const adminPassword = process.env.ADMIN_PASSWORD
    || (process.env.NODE_ENV === 'production' ? undefined : '1234');
  if (!adminMobile || !adminPassword) {
    console.info('Default branches seeded. Set ADMIN_PASSWORD to seed an administrator in production.');
    return;
  }
  const isDevelopmentTestPassword = process.env.NODE_ENV !== 'production' && adminPassword === '1234';
  if (!/^\d{10}$/.test(adminMobile) || (!isDevelopmentTestPassword && adminPassword.length < 12)) {
    throw new Error('ADMIN_MOBILE must be 10 digits and ADMIN_PASSWORD must be at least 12 characters (except the local test password 1234).');
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.user.upsert({
    where: { mobile: adminMobile },
    update: {
      name: 'System Administrator',
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
    create: {
      name: 'System Administrator',
      mobile: adminMobile,
      passwordHash,
      role: UserRole.ADMIN,
    },
  });
  console.info('System administrator seeded.');
}

seed()
  .catch((error: unknown) => {
    console.error('Backend seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
