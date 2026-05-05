import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '用户名和密码不能为空' },
        { status: 400 }
      )
    }

    // Check Teacher table
    const teacher = await prisma.teacher.findUnique({
      where: { username },
    })

    if (teacher) {
      const isValid = await bcrypt.compare(password, teacher.password)
      if (isValid) {
        const token = await signToken({
          id: teacher.id,
          role: 'teacher',
          name: teacher.name,
        })

        const response = NextResponse.json({
          success: true,
          user: { id: teacher.id, name: teacher.name, role: 'teacher' },
          token,
        })

        response.cookies.set('auth-token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        })

        return response
      }
    }

    // Check Student table
    const student = await prisma.student.findUnique({
      where: { username },
    })

    if (student) {
      const isValid = await bcrypt.compare(password, student.password)
      if (isValid) {
        const token = await signToken({
          id: student.id,
          role: 'student',
          name: student.name,
        })

        const response = NextResponse.json({
          success: true,
          user: { id: student.id, name: student.name, role: 'student' },
          token,
        })

        response.cookies.set('auth-token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/',
        })

        return response
      }
    }

    return NextResponse.json(
      { success: false, message: '用户名或密码错误' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
