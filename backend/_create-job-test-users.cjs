const { Client } = require('pg');
const bcrypt = require('bcrypt');

(async () => {
  const c = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/snp_manpower?schema=public' });
  await c.connect();
  const passwordHash = await bcrypt.hash('TestPass1234', 12);
  const users = [
    ['Job Test Admin', '9000000001', 'ADMIN'],
    ['Job Test Super Admin', '9000000002', 'SUPER_ADMIN'],
    ['Job Test Applicant', '9000000003', 'APPLICANT'],
  ];
  for (const [name, mobile, role] of users) {
    await c.query('delete from "User" where mobile = $1', [mobile]);
    await c.query(
      'insert into "User" (name, mobile, "passwordHash", role, "isActive", "createdAt", "updatedAt") values ($1,$2,$3,$4::"UserRole",true,now(),now())',
      [name, mobile, passwordHash, role],
    );
  }
  console.log('temporary job test users created');
  await c.end();
})().catch((e) => { console.error(e); process.exit(1); });
