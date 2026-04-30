import { prisma } from './prisma'

// Returns the ID of the only user in the platform.
// Replace this with session-based lookup once auth is added.
export async function getCurrentUserId(): Promise<string> {
  const user = await prisma.users.findFirstOrThrow({ select: { id: true } })
  return user.id
}
