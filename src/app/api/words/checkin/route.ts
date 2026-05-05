import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

type IncomingCheckin = {
  wordId?: string
  status?: string
  correct?: boolean
}

type WordCheckinSummary = {
  wordId: string
  status: string
  date: Date
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

// POST: Student only - record one or more word checkins
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const checkins: IncomingCheckin[] = Array.isArray(body.checkins)
      ? body.checkins
      : [{ wordId: body.wordId, status: body.status, correct: body.correct }]

    if (
      checkins.length === 0 ||
      checkins.some((checkin) => !checkin.wordId || !checkin.status)
    ) {
      return NextResponse.json(
        { success: false, message: 'wordId and status are required' },
        { status: 400 }
      )
    }

    const validCheckins = checkins.map((checkin) => ({
      wordId: checkin.wordId as string,
      status: checkin.status as string,
      correct: checkin.correct,
    }))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const savedCheckins = []

    for (const { wordId, status, correct } of validCheckins) {
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

      if (existingCheckin) {
        savedCheckins.push(
          await prisma.wordCheckin.update({
            where: { id: existingCheckin.id },
            data: {
              status,
              correct: correct !== undefined ? correct : existingCheckin.correct,
            },
          })
        )
      } else {
        savedCheckins.push(
          await prisma.wordCheckin.create({
            data: {
              studentId: user.id,
              wordId,
              status,
              correct: correct !== undefined ? correct : null,
            },
          })
        )
      }
    }

    const allCheckins = await prisma.wordCheckin.findMany({
      where: { studentId: user.id },
      select: {
        wordId: true,
        status: true,
        date: true,
      },
    })

    return NextResponse.json({
      success: true,
      checkins: savedCheckins,
      masteredCount: countMasteredWords(allCheckins as WordCheckinSummary[]),
    })
  } catch (error) {
    console.error('Word checkin error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}
