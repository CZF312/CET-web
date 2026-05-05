import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

type QuizListRow = {
  id: string
  type: string
  title: string
  difficulty: number
  createdAt: Date
  _count: { attempts: number }
}

// GET: Student only - get quiz list with optional filters
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
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    if (type) {
      where.type = type
    }

    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          difficulty: true,
          createdAt: true,
          _count: {
            select: { attempts: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.quiz.count({ where }),
    ])

    // Add student's attempt info for each quiz
    const quizzesWithAttempt = await Promise.all(
      (quizzes as QuizListRow[]).map(async (quiz) => {
        const attempt = await prisma.quizAttempt.findFirst({
          where: {
            studentId: user.id,
            quizId: quiz.id,
          },
          select: { score: true, total: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        })

        return {
          ...quiz,
          lastScore: attempt?.score ?? null,
          lastTotal: attempt?.total ?? null,
          lastAttemptAt: attempt?.createdAt ?? null,
        }
      })
    )

    return NextResponse.json({
      success: true,
      quizzes: quizzesWithAttempt,
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error('Get quizzes error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
