import { prisma } from '@/lib/prisma'

// Returns the ID of the only user in the platform.
// Replace this with session-based lookup once auth is added.
export async function getCurrentUserId(): Promise<string> {
  const user = await prisma.users.findFirstOrThrow({ select: { id: true } })
  return user.id
}

export type CurrentUser = { id: string; name: string; email: string }

// Returns the only user in the platform. Same single-user shortcut as
// `getCurrentUserId` — both go away once we add auth.
export async function getCurrentUser(): Promise<CurrentUser> {
  return prisma.users.findFirstOrThrow({
    select: { id: true, name: true, email: true },
  })
}
