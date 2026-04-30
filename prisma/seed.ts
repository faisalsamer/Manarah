import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../app/generated/prisma/client'
import { config as loadEnv } from 'dotenv'
import path from 'node:path'

loadEnv({ path: path.resolve(process.cwd(), '.env') })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const user = await prisma.users.upsert({
    where: { email: 'ahmed@example.com' },
    update: {},
    create: {
      name: 'Ahmed Al-Farsi',
      email: 'ahmed@example.com',
    },
  })

  console.log(`Demo user ready: ${user.id} (${user.email})`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
