import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// GET: Teacher only - list all students for the logged-in teacher
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: '无权限访问' },
        { status: 403 }
      )
    }

    const students = await prisma.student.findMany({
      where: { teacherId: user.id },
      select: {
        id: true,
        username: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            wordCheckins: true,
            quizAttempts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, students })
  } catch (error) {
    console.error('Get students error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
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
        { success: false, message: '无权限访问' },
        { status: 403 }
      )
    }

    const { username, password, name } = await request.json()

    if (!username || !password || !name) {
      return NextResponse.json(
        { success: false, message: '用户名、密码和姓名不能为空' },
        { status: 400 }
      )
    }

    // Check if username already exists
    const existingStudent = await prisma.student.findUnique({
      where: { username },
    })

    if (existingStudent) {
      return NextResponse.json(
        { success: false, message: '用户名已存在' },
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
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
