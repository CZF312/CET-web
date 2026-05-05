import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// POST: Student only - submit quiz attempt
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { success: false, message: '无权限访问' },
        { status: 403 }
      )
    }

    const { quizId, answers, duration } = await request.json()

    if (!quizId || !answers) {
      return NextResponse.json(
        { success: false, message: 'quizId 和 answers 不能为空' },
        { status: 400 }
      )
    }

    // Get quiz content to calculate score
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { content: true },
    })

    if (!quiz) {
      return NextResponse.json(
        { success: false, message: '测验不存在' },
        { status: 404 }
      )
    }

    let quizContent
    try {
      quizContent = JSON.parse(quiz.content)
    } catch {
      return NextResponse.json(
        { success: false, message: '测验内容格式错误' },
        { status: 500 }
      )
    }

    // Calculate score
    let correct = 0
    let wrong = 0
    const total = quizContent.questions?.length || 0

    if (Array.isArray(quizContent.questions)) {
      for (const question of quizContent.questions) {
        const questionId = question.id || question.questionId
        const studentAnswer = answers[questionId]
        const correctAnswer = question.correctAnswer || question.answer

        if (studentAnswer === correctAnswer) {
          correct++
        } else {
          wrong++
        }
      }
    }

    const score = total > 0 ? Math.round((correct / total) * 100) : 0

    // Save quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        studentId: user.id,
        quizId,
        answers: JSON.stringify(answers),
        score,
        total,
        duration: duration || 0,
      },
    })

    return NextResponse.json({
      success: true,
      score,
      total,
      correct,
      wrong,
      attemptId: attempt.id,
    })
  } catch (error) {
    console.error('Submit quiz error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
