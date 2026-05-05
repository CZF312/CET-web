import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// GET: Student only - get full quiz details by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== 'student') {
      return NextResponse.json(
        { success: false, message: '无权限访问' },
        { status: 403 }
      )
    }

    const { id } = await params

    const quiz = await prisma.quiz.findUnique({
      where: { id },
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
        difficulty: true,
        createdAt: true,
      },
    })

    if (!quiz) {
      return NextResponse.json(
        { success: false, message: '测验不存在' },
        { status: 404 }
      )
    }

    // Parse content JSON
    let parsedContent
    try {
      parsedContent = JSON.parse(quiz.content)
    } catch {
      parsedContent = quiz.content
    }

    return NextResponse.json({
      success: true,
      quiz: {
        ...quiz,
        content: parsedContent,
      },
    })
  } catch (error) {
    console.error('Get quiz detail error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
