import 'dotenv/config'
import { prisma } from '../src/db/prisma.js'
import { UserRole } from '../src/generated/prisma/index.js'

/**
 * Dev seed: one admin and one regular user (both with names).
 * Run: `npm run db:seed`
 */
async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@techscopper.local' },
    create: {
      email: 'admin@techscopper.local',
      name: 'Admin',
      role: UserRole.ADMIN,
    },
    update: {
      name: 'Admin',
      role: UserRole.ADMIN,
    },
  })

  await prisma.user.upsert({
    where: { email: 'user@techscopper.local' },
    create: {
      email: 'user@techscopper.local',
      name: 'Regular User',
      role: UserRole.USER,
    },
    update: {
      name: 'Regular User',
      role: UserRole.USER,
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
