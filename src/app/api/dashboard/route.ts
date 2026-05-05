import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

type WordCheckinSummary = {
  id: string
  wordId: string
  status: string
  date: Date
}

type QuizAttemptSummary = {
  id: string
  score: number
  total: number
  createdAt: Date
}

type StudentDashboardRow = {
  id: string
  username: string
  name: string
  createdAt: Date
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

// GET: Teacher only - get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    const teacherId = user.id

    const [totalStudents, totalWords, totalQuizzes] = await Promise.all([
      prisma.student.count({ where: { teacherId } }),
      prisma.word.count(),
      prisma.quiz.count(),
    ])

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const activeTodayCheckins = await prisma.wordCheckin.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
        student: { teacherId },
      },
      select: { studentId: true },
      distinct: ['studentId'],
    })

    const activeTodayAttempts = await prisma.quizAttempt.findMany({
      where: {
        createdAt: { gte: today, lt: tomorrow },
        student: { teacherId },
      },
      select: { studentId: true },
      distinct: ['studentId'],
    })

    const activeStudentIds = new Set([
      ...(activeTodayCheckins as { studentId: string }[]).map((c) => c.studentId),
      ...(activeTodayAttempts as { studentId: string }[]).map((a) => a.studentId),
    ])

    const students = (await prisma.student.findMany({
      where: { teacherId },
      select: {
        id: true,
        username: true,
        name: true,
        createdAt: true,
        wordCheckins: {
          select: { id: true, wordId: true, status: true, date: true },
        },
        quizAttempts: {
          select: { id: true, score: true, total: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })) as StudentDashboardRow[]

    const totalCheckins = students.reduce(
      (sum, student) => sum + student.wordCheckins.length,
      0
    )
    const totalAttempts = students.reduce(
      (sum, student) => sum + student.quizAttempts.length,
      0
    )
    const totalAttemptScore = students.reduce(
      (sum, student) =>
        sum + student.quizAttempts.reduce((studentSum, attempt) => studentSum + attempt.score, 0),
      0
    )
    const overallAverage =
      totalAttempts > 0 ? Math.round(totalAttemptScore / totalAttempts) : 0

    const studentStats = students.map((student) => {
      const quizAttemptCount = student.quizAttempts.length
      const totalScore = student.quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0)
      const averageScore =
        quizAttemptCount > 0 ? Math.round(totalScore / quizAttemptCount) : 0
      const allDates = [
        ...student.wordCheckins.map((checkin) => checkin.date.getTime()),
        ...student.quizAttempts.map((attempt) => attempt.createdAt.getTime()),
      ]
      const lastActive = allDates.length > 0 ? new Date(Math.max(...allDates)) : null

      return {
        id: student.id,
        name: student.name,
        username: student.username,
        wordCheckinCount: student.wordCheckins.length,
        masteredWords: countMasteredWords(student.wordCheckins),
        quizAttemptCount,
        averageScore,
        lastActive: formatDateLabel(lastActive),
      }
    })

    const recentActivities = students
      .flatMap((student) => [
        ...student.wordCheckins.map((checkin) => ({
          id: `word-${checkin.id}`,
          studentName: student.name,
          action: 'checked in a word',
          time: formatDateLabel(checkin.date),
          sortTime: checkin.date.getTime(),
        })),
        ...student.quizAttempts.map((attempt) => ({
          id: `quiz-${attempt.id}`,
          studentName: student.name,
          action: 'submitted a quiz',
          time: formatDateLabel(attempt.createdAt),
          sortTime: attempt.createdAt.getTime(),
        })),
      ])
      .sort((a, b) => b.sortTime - a.sortTime)
      .slice(0, 8)
      .map((activity) => ({
        id: activity.id,
        studentName: activity.studentName,
        action: activity.action,
        time: activity.time,
      }))

    return NextResponse.json({
      success: true,
      stats: {
        totalStudents,
        activeToday: activeStudentIds.size,
        totalWords,
        totalQuizzes,
        totalCheckins,
        totalAttempts,
        overallAverage,
      },
      students: studentStats,
      recentActivities,
    })
  } catch (error) {
    console.error('Get dashboard error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}
