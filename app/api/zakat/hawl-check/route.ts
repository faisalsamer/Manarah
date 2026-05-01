// GET /api/zakat/hawl-check
// Called daily at 06:00 Asia/Riyadh via cron
// For each user with an active hawl: checks balance vs nisab,
// breaks hawl if below, completes if 354 days passed,
// auto-restarts for recently broken hawls now above nisab.
// Secured with CRON_SECRET header.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runTodayHawlCheck, startNewHawl } from '@/lib/zakat/hawl'
import { getTodayNisabPrices } from '@/lib/gold-api'
import { isAboveNisab } from '@/lib/zakat/calculator'
import { toRiyadhDateString } from '@/utils/date'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = toRiyadhDateString()
  const results: Array<{ userId: string; result: string }> = []

  try {
    const activeHawls = await prisma.zakat_hawl.findMany({
      where: { status: 'ACTIVE' as any },
      include: { user_zakat_settings: true },
    })

    await getTodayNisabPrices()

    for (const hawl of activeHawls as any[]) {
      const userId: string = hawl.user_id
      const nisabStandard = hawl.nisab_standard

      try {
        const userAccounts = await prisma.accounts.findMany({
          where: { banks: { user_id: userId, is_connected: true } },
          select: { balance: true },
        })
        const bankBalance = userAccounts.reduce((sum, a) => sum + Number(a.balance), 0)

        const manualAssetsAgg = await prisma.zakat_assets.aggregate({
          where: { user_id: userId, status: 'ACTIVE' },
          _sum: { amount: true },
        })
        const manualAssetsTotal = Number(manualAssetsAgg._sum.amount ?? 0)

        const checkResult = await runTodayHawlCheck(
          hawl.id,
          userId,
          nisabStandard,
          bankBalance,
          manualAssetsTotal
        )

        if (checkResult.hawlBroke) {
          results.push({ userId, result: `hawl_broken — balance: ${checkResult.checkResult.totalNetWorth}` })
        } else if (checkResult.hawlCompleted) {
          results.push({ userId, result: 'hawl_completed — zakat is now due' })
        } else {
          results.push({ userId, result: `ok — net worth: ${checkResult.checkResult.totalNetWorth}` })
        }
      } catch (userError) {
        console.error(`[CRON] Error for userId ${userId}:`, userError)
        results.push({ userId, result: `error: ${(userError as Error).message}` })
      }
    }

    // Auto-restart hawls broken in the last 7 days if balance recovered
    const brokenHawlUsers = await prisma.zakat_hawl.findMany({
      where: {
        status: 'BROKEN' as any,
        broken_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      include: { user_zakat_settings: true },
    })

    const prices = await getTodayNisabPrices()

    for (const brokenHawl of brokenHawlUsers as any[]) {
      const userId: string = brokenHawl.user_id

      const existingActive = await prisma.zakat_hawl.findFirst({
        where: { user_id: userId, status: 'ACTIVE' as any },
      })
      if (existingActive) continue

      const userAccounts = await prisma.accounts.findMany({
        where: { banks: { user_id: userId, is_connected: true } },
        select: { balance: true },
      })
      const bankBalance = userAccounts.reduce((sum, a) => sum + Number(a.balance), 0)

      const manualAssetsAgg = await prisma.zakat_assets.aggregate({
        where: { user_id: userId, status: 'ACTIVE' },
        _sum: { amount: true },
      })
      const manualTotal = Number(manualAssetsAgg._sum.amount ?? 0)
      const total = bankBalance + manualTotal

      if (isAboveNisab(total, brokenHawl.nisab_standard, prices)) {
        const newHawlId = await startNewHawl(userId, brokenHawl.nisab_standard, total, today)
        results.push({ userId, result: `new_hawl_started — id: ${newHawlId}` })
      }
    }

    return NextResponse.json({
      success: true,
      date: today,
      processed: activeHawls.length,
      results,
    })
  } catch (error) {
    console.error('[CRON hawl-check]', error)
    return NextResponse.json({ success: false, error: 'Cron job failed' }, { status: 500 })
  }
}
