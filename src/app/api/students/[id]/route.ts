import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

type WordCheckinSummary = {
  id: string
  wordId: string
  status: string
  date: Date
  word?: { word: string }
}

type QuizAttemptSummary = {
  id: string
  score: number
  total: number
  createdAt: Date
  quiz?: { title: string }
}

type StudentDetailRow = {
  id: string
  name: string
  username: string
  teacherId: string
  wordCheckins: WordCheckinSummary[]
  quizAttempts: QuizAttemptSummary[]
}

function formatDateLabel(date: Date | null) {
  if (!date) return 'Never'

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const startOfDate = new Date(date)
  startOfDate.setHours(0, 0, 0, 0)

  const diffDays = Math.round(
    (startOfToday.getTime() - startOfDate.getTime()) / (24 * 60 * 60 * 1000)
  )

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
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

function countStreakDays(checkins: WordCheckinSummary[]) {
  let streak = 0
  const checkinDates = new Set<string>()

  for (const checkin of checkins) {
    checkinDates.add(checkin.date.toISOString().split('T')[0])
  }

  const currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  const todayStr = currentDate.toISOString().split('T')[0]
  if (!checkinDates.has(todayStr)) {
    currentDate.setDate(currentDate.getDate() - 1)
  }

  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0]
    if (!checkinDates.has(dateStr)) break

    streak++
    currentDate.setDate(currentDate.getDate() - 1)
  }

  return streak
}

// GET: Student self summary via /api/students/me, or teacher-owned student summary
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    const { id } = await params
    const studentId = id === 'me' && user.role === 'student' ? user.id : id

    if (user.role === 'student' && studentId !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    const where =
      user.role === 'teacher'
        ? { id: studentId, teacherId: user.id }
        : { id: studentId }

    const student = (await prisma.student.findFirst({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        teacherId: true,
        wordCheckins: {
          select: {
            id: true,
            wordId: true,
            status: true,
            date: true,
            word: { select: { word: true } },
          },
          orderBy: { date: 'desc' },
        },
        quizAttempts: {
          select: {
            id: true,
            score: true,
            total: true,
            createdAt: true,
            quiz: { select: { title: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })) as StudentDetailRow | null

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayCheckins = student.wordCheckins.filter(
      (checkin) => checkin.date >= today && checkin.date < tomorrow
    ).length

    const recentActivities = [
      ...student.wordCheckins.slice(0, 5).map((checkin) => ({
        id: `word-${checkin.id}`,
        action: `checked in ${checkin.word?.word || 'a word'}`,
        time: formatDateLabel(checkin.date),
        sortTime: checkin.date.getTime(),
      })),
      ...student.quizAttempts.slice(0, 5).map((attempt) => ({
        id: `quiz-${attempt.id}`,
        action: `finished ${attempt.quiz?.title || 'a quiz'}`,
        time: formatDateLabel(attempt.createdAt),
        sortTime: attempt.createdAt.getTime(),
      })),
    ]
      .sort((a, b) => b.sortTime - a.sortTime)
      .slice(0, 5)
      .map((activity) => ({
        id: activity.id,
        action: activity.action,
        time: activity.time,
      }))

    return NextResponse.json({
      success: true,
      id: student.id,
      name: student.name,
      username: student.username,
      todayCheckins,
      masteredWords: countMasteredWords(student.wordCheckins),
      streakDays: countStreakDays(student.wordCheckins),
      recentActivities,
    })
  } catch (error) {
    console.error('Get student detail error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

// DELETE: Teacher only - delete a student by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    const { id } = await params

    const student = await prisma.student.findFirst({
      where: { id, teacherId: user.id },
    })

    if (!student) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      )
    }

    await prisma.quizAttempt.deleteMany({ where: { studentId: id } })
    await prisma.wordCheckin.deleteMany({ where: { studentId: id } })
    await prisma.student.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Student deleted' })
  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}
