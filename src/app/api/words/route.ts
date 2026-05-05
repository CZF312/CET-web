import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

type WordCheckinSummary = {
  wordId: string
  status: string
  correct: boolean | null
  date: Date
}

type WordRow = Record<string, unknown> & {
  checkins: WordCheckinSummary[]
}

function countMasteredWords(checkins: WordCheckinSummary[]) {
  const latestCheckinByWord = new Map<string, WordCheckinSummary>()

  for (const checkin of checkins) {
    const existing = latestCheckinByWord.get(checkin.wordId)
    if (!existing || checkin.date > existing.date) {
      latestCheckinByWord.set(checkin.wordId, checkin)
    }
  }

  return Array.from(latestCheckinByWord.values()).filter(
    (checkin) => checkin.status === 'mastered'
  ).length
}

// GET: Student only - get paginated words with checkin status
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
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

    const [words, total, totalWords, allCheckins] = await Promise.all([
      prisma.word.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ level: 'asc' }, { word: 'asc' }],
        include: {
          checkins: {
            where: { studentId: user.id },
            select: {
              wordId: true,
              status: true,
              correct: true,
              date: true,
            },
            orderBy: { date: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.word.count({ where }),
      prisma.word.count(),
      prisma.wordCheckin.findMany({
        where: { studentId: user.id },
        select: {
          wordId: true,
          status: true,
          correct: true,
          date: true,
        },
      }),
    ])

    const wordsWithStatus = (words as WordRow[]).map((word) => {
      const { checkins, ...wordData } = word
      const latestCheckin = checkins.length > 0 ? checkins[0] : null
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
      totalWords,
      masteredCount: countMasteredWords(allCheckins as WordCheckinSummary[]),
      page,
      limit,
    })
  } catch (error) {
    console.error('Get words error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}
