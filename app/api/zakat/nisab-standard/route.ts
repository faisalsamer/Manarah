// GET|PATCH /api/zakat/nisab-standard
// Allows user to change nisab standard (silver ↔ gold)
// Locked until current hawl completes and zakat is paid

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUserId } from '@/lib/user'
import { toRiyadhDateString } from '@/utils/date'

export const dynamic = 'force-dynamic'

const ChangeSchema = z.object({
  nisabStandard: z.enum(['SILVER', 'GOLD']),
  confirmed: z.boolean().refine((v) => v === true, { message: 'يجب تأكيد التغيير' }),
})

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getCurrentUserId()

    const settings = await prisma.user_zakat_settings.findUnique({ where: { user_id: userId } })
    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'إعدادات الزكاة غير موجودة' },
        { status: 404 }
      )
    }

    if (settings.nisab_standard_confirmed) {
      const today = toRiyadhDateString()
      const lockedUntil = settings.nisab_locked_until
        ? toRiyadhDateString(settings.nisab_locked_until)
        : null

      if (lockedUntil && today < lockedUntil) {
        return NextResponse.json(
          {
            success: false,
            error: 'لا يمكن تغيير معيار النصاب حتى نهاية الحول الحالي',
            lockedUntil,
            daysRemaining: Math.ceil(
              (new Date(lockedUntil).getTime() - new Date(today).getTime()) /
                (1000 * 60 * 60 * 24)
            ),
          },
          { status: 403 }
        )
      }
    }

    const body = await req.json()
    const parsed = ChangeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'بيانات غير صحيحة', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { nisabStandard } = parsed.data

    if (nisabStandard === settings.nisab_standard) {
      return NextResponse.json(
        { success: false, error: 'معيار النصاب المختار هو نفس الحالي' },
        { status: 400 }
      )
    }

    const updated = await prisma.user_zakat_settings.update({
      where: { user_id: userId },
      data: {
        nisab_standard: nisabStandard,
        nisab_standard_confirmed: true,
        nisab_locked_until: null,
      },
    })

    await prisma.zakat_hawl.updateMany({
      where: { user_id: userId, status: 'ACTIVE' as any },
      data: { nisab_standard: nisabStandard },
    })

    return NextResponse.json({
      success: true,
      data: {
        previousStandard: settings.nisab_standard,
        newStandard: nisabStandard,
        message:
          nisabStandard === 'SILVER'
            ? 'تم التغيير إلى نصاب الفضة (595 غراماً). سيُطبَّق على الحساب الحالي.'
            : 'تم التغيير إلى نصاب الذهب (85 غراماً). سيُطبَّق على الحساب الحالي.',
      },
    })
  } catch (error) {
    console.error('[PATCH /api/zakat/nisab-standard]', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const userId = await getCurrentUserId()

    const settings = await prisma.user_zakat_settings.findUnique({
      where: { user_id: userId },
      select: {
        nisab_standard: true,
        nisab_standard_confirmed: true,
        nisab_locked_until: true,
      },
    })

    if (!settings) {
      return NextResponse.json({ success: false, error: 'الإعدادات غير موجودة' }, { status: 404 })
    }

    const today = toRiyadhDateString()
    const lockedUntil = settings.nisab_locked_until
      ? toRiyadhDateString(settings.nisab_locked_until)
      : null

    const isLocked = !!lockedUntil && today < lockedUntil

    return NextResponse.json({
      success: true,
      data: {
        current: settings.nisab_standard,
        isLocked,
        lockedUntil,
        canChange: !isLocked,
        message: isLocked
          ? `معيار النصاب مقفل حتى ${lockedUntil}. يمكن التغيير بعد اكتمال الحول ودفع الزكاة.`
          : 'يمكنك تغيير معيار النصاب الآن.',
      },
    })
  } catch (error) {
    console.error('[GET /api/zakat/nisab-standard]', error)
    return NextResponse.json({ success: false, error: 'خطأ في الخادم' }, { status: 500 })
  }
}
