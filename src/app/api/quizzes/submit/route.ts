import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

type QuizQuestion = {
  id?: string
  questionId?: string
  correctAnswer?: string
  answer?: string
}

// POST: Student only - submit quiz attempt
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    const { quizId, answers, duration } = (await request.json()) as {
      quizId?: string
      answers?: Record<string, string>
      duration?: number
    }

    if (!quizId || !answers) {
      return NextResponse.json(
        { success: false, message: 'quizId and answers are required' },
        { status: 400 }
      )
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { content: true },
    })

    if (!quiz) {
      return NextResponse.json(
        { success: false, message: 'Quiz not found' },
        { status: 404 }
      )
    }

    let quizContent
    try {
      quizContent = JSON.parse(quiz.content)
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid quiz content' },
        { status: 500 }
      )
    }

    let correct = 0
    let wrong = 0
    const questions: QuizQuestion[] = Array.isArray(quizContent)
      ? quizContent
      : quizContent.questions || []
    const total = questions.length
    const correctAnswers: Record<string, string> = {}

    for (const question of questions) {
      const questionId = question.id || question.questionId
      if (!questionId) continue

      const studentAnswer = answers[questionId]
      const correctAnswer = question.correctAnswer || question.answer

      if (correctAnswer) {
        correctAnswers[questionId] = correctAnswer
      }

      if (studentAnswer === correctAnswer) {
        correct++
      } else {
        wrong++
      }
    }

    const score = total > 0 ? Math.round((correct / total) * 100) : 0

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
      result: {
        score: correct,
        total,
        duration: duration || 0,
        answers,
        correctAnswers,
      },
      attemptId: attempt.id,
    })
  } catch (error) {
    console.error('Submit quiz error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}
