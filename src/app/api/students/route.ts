import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

type StudentListRow = {
  id: string
  username: string
  name: string
  createdAt: Date
  wordCheckins: { date: Date }[]
  quizAttempts: { score: number; createdAt: Date }[]
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

// GET: Teacher only - list all students for the logged-in teacher
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    const students = (await prisma.student.findMany({
      where: { teacherId: user.id },
      select: {
        id: true,
        username: true,
        name: true,
        createdAt: true,
        wordCheckins: {
          select: { date: true },
        },
        quizAttempts: {
          select: { score: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })) as StudentListRow[]

    const formattedStudents = students.map((student) => {
      const totalScore = student.quizAttempts.reduce(
        (sum, attempt) => sum + attempt.score,
        0
      )
      const averageScore =
        student.quizAttempts.length > 0
          ? Math.round(totalScore / student.quizAttempts.length)
          : 0
      const allDates = [
        ...student.wordCheckins.map((checkin) => checkin.date.getTime()),
        ...student.quizAttempts.map((attempt) => attempt.createdAt.getTime()),
      ]
      const lastActive = allDates.length > 0 ? new Date(Math.max(...allDates)) : null

      return {
        id: student.id,
        username: student.username,
        name: student.name,
        wordCheckinCount: student.wordCheckins.length,
        quizAttemptCount: student.quizAttempts.length,
        averageScore,
        lastActive: formatDateLabel(lastActive),
      }
    })

    return NextResponse.json({ success: true, students: formattedStudents })
  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    )
  }
}

// POST: Teacher only - create a new student
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      )
    }

    const { username, password, name } = await request.json()

    if (!username || !password || !name) {
      return NextResponse.json(
        {
          success: false,
          message: '鐢ㄦ埛鍚嶃€佸瘑鐮佸拰濮撳悕涓嶈兘涓虹┖',
          error: '鐢ㄦ埛鍚嶃€佸瘑鐮佸拰濮撳悕涓嶈兘涓虹┖',
        },
        { status: 400 }
      )
    }

    const existingStudent = await prisma.student.findUnique({
      where: { username },
    })

    if (existingStudent) {
      return NextResponse.json(
        {
          success: false,
          message: '鐢ㄦ埛鍚嶅凡瀛樺湪',
          error: '鐢ㄦ埛鍚嶅凡瀛樺湪',
        },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const student = await prisma.student.create({
      data: {
        username,
        password: hashedPassword,
        name,
        teacherId: user.id,
      },
      select: {
        id: true,
        username: true,
        name: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ success: true, student }, { status: 201 })
  } catch (error) {
    console.error('Create student error:', error)
    return NextResponse.json(
      { success: false, message: 'Server error', error: 'Server error' },
      { status: 500 }
    )
  }
}
