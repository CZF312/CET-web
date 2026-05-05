import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET: Teacher only - get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: '无权限访问' },
        { status: 403 }
      )
    }

    const teacherId = user.id

    // Get overview stats
    const [totalStudents, totalWords, totalQuizzes] = await Promise.all([
      prisma.student.count({ where: { teacherId } }),
      prisma.word.count(),
      prisma.quiz.count(),
    ])

    // Active today: students who have checkins or quiz attempts today
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
      ...activeTodayCheckins.map((c) => c.studentId),
      ...activeTodayAttempts.map((a) => a.studentId),
    ])
    const activeToday = activeStudentIds.size

    // Get detailed student stats
    const students = await prisma.student.findMany({
      where: { teacherId },
      select: {
        id: true,
        name: true,
        wordCheckins: {
          select: { id: true, date: true },
        },
        quizAttempts: {
          select: { id: true, score: true, total: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const studentStats = students.map((student) => {
      const wordCheckins = student.wordCheckins.length
      const quizAttempts = student.quizAttempts.length

      // Calculate average score
      const totalScore = student.quizAttempts.reduce((sum, a) => sum + a.score, 0)
      const avgScore = quizAttempts > 0 ? Math.round(totalScore / quizAttempts) : 0

      // Find last active date
      const allDates = [
        ...student.wordCheckins.map((c) => new Date(c.date).getTime()),
        ...student.quizAttempts.map((a) => new Date(a.createdAt).getTime()),
      ]
      const lastActive = allDates.length > 0 ? new Date(Math.max(...allDates)) : null

      return {
        id: student.id,
        name: student.name,
        wordCheckins,
        quizAttempts,
        avgScore,
        lastActive,
      }
    })

    return NextResponse.json({
      success: true,
      totalStudents,
      activeToday,
      totalWords,
      totalQuizzes,
      students: studentStats,
    })
  } catch (error) {
    console.error('Get dashboard error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
