import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/lib/Prisma';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const email    = process.env.SEED_USER_EMAIL?.trim();
  const name     = process.env.SEED_USER_NAME?.trim();
  const password = process.env.SEED_USER_PASSWORD?.trim();

  const missing = [
    !email    && 'SEED_USER_EMAIL',
    !name     && 'SEED_USER_NAME',
    !password && 'SEED_USER_PASSWORD',
  ].filter(Boolean);

  if (missing.length) {
    console.error('\n❌  Faltan variables en .env:');
    missing.forEach(v => console.error(`   ${v}`));
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email: email! } });

  if (existing) {
    console.log('\n✅  Usuario ya existe — reutilizando.');
    console.log(`   nombre : ${existing.name}`);
    console.log(`   email  : ${existing.email}`);
    console.log(`   id     : ${existing.id}\n`);
    return;
  }

  const hashed = await bcrypt.hash(password!, 10);
  const user   = await prisma.user.create({
    data: { email: email!, name: name!, password: hashed },
  });

  console.log('\n✅  Usuario creado.');
  console.log(`   nombre : ${user.name}`);
  console.log(`   email  : ${user.email}`);
  console.log(`   id     : ${user.id}\n`);
}

main()
  .catch(e => { console.error('\n❌  Error:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
