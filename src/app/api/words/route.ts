import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET: Student only - get paginated words with checkin status
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { success: false, message: '无权限访问' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const level = searchParams.get('level')

    const where: Record<string, unknown> = {}
    if (level) {
      where.level = parseInt(level, 10)
    }

    const [words, total] = await Promise.all([
      prisma.word.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ level: 'asc' }, { word: 'asc' }],
        include: {
          checkins: {
            where: { studentId: user.id },
            select: {
              id: true,
              status: true,
              correct: true,
              date: true,
            },
          },
        },
      }),
      prisma.word.count({ where }),
    ])

    const wordsWithStatus = words.map((word) => {
      const { checkins, ...wordData } = word
      const latestCheckin = checkins.length > 0 ? checkins[checkins.length - 1] : null
      return {
        ...wordData,
        checkinStatus: latestCheckin?.status || null,
        checkinCorrect: latestCheckin?.correct ?? null,
        checkinDate: latestCheckin?.date || null,
      }
    })

    return NextResponse.json({
      success: true,
      words: wordsWithStatus,
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error('Get words error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
