import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET: Student only - get word learning progress summary
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { success: false, message: '无权限访问' },
        { status: 403 }
      )
    }

    const totalWords = await prisma.word.count()

    // Get all checkins for this student
    const checkins = await prisma.wordCheckin.findMany({
      where: { studentId: user.id },
      select: {
        wordId: true,
        status: true,
        date: true,
      },
    })

    // Count unique words learned and mastered
    const uniqueWordIds = new Set(checkins.map((c) => c.wordId))
    const learned = uniqueWordIds.size

    // Mastered: words where the latest checkin status is 'mastered'
    const latestCheckinByWord = new Map<string, { status: string; date: Date }>()
    for (const checkin of checkins) {
      const existing = latestCheckinByWord.get(checkin.wordId)
      if (!existing || checkin.date > existing.date) {
        latestCheckinByWord.set(checkin.wordId, {
          status: checkin.status,
          date: checkin.date,
        })
      }
    }

    let mastered = 0
    for (const [, value] of latestCheckinByWord) {
      if (value.status === 'mastered') {
        mastered++
      }
    }

    // Today's count
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayCount = await prisma.wordCheckin.count({
      where: {
        studentId: user.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    // Calculate streak (consecutive days with at least one checkin)
    let streak = 0
    const checkinDates = new Set<string>()
    for (const checkin of checkins) {
      const dateStr = new Date(checkin.date).toISOString().split('T')[0]
      checkinDates.add(dateStr)
    }

    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    // Check if the student has checked in today
    const todayStr = currentDate.toISOString().split('T')[0]
    if (!checkinDates.has(todayStr)) {
      // If no checkin today, start checking from yesterday
      currentDate.setDate(currentDate.getDate() - 1)
    }

    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0]
      if (checkinDates.has(dateStr)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return NextResponse.json({
      success: true,
      total: totalWords,
      learned,
      mastered,
      todayCount,
      streak,
    })
  } catch (error) {
    console.error('Get word progress error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
