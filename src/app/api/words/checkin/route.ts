import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// POST: Student only - record word checkin (upsert)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { success: false, message: '无权限访问' },
        { status: 403 }
      )
    }

    const { wordId, status, correct } = await request.json()

    if (!wordId || !status) {
      return NextResponse.json(
        { success: false, message: 'wordId 和 status 不能为空' },
        { status: 400 }
      )
    }

    // Get today's date range (start of day)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Check if already checked in today
    const existingCheckin = await prisma.wordCheckin.findFirst({
      where: {
        studentId: user.id,
        wordId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    let checkin

    if (existingCheckin) {
      // Update existing checkin
      checkin = await prisma.wordCheckin.update({
        where: { id: existingCheckin.id },
        data: {
          status,
          correct: correct !== undefined ? correct : existingCheckin.correct,
        },
      })
    } else {
      // Create new checkin
      checkin = await prisma.wordCheckin.create({
        data: {
          studentId: user.id,
          wordId,
          status,
          correct: correct !== undefined ? correct : null,
        },
      })
    }

    return NextResponse.json({ success: true, checkin })
  } catch (error) {
    console.error('Word checkin error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
