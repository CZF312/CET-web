import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

// DELETE: Teacher only - delete a student by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request)

    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, message: '无权限访问' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verify the student belongs to this teacher
    const student = await prisma.student.findFirst({
      where: { id, teacherId: user.id },
    })

    if (!student) {
      return NextResponse.json(
        { success: false, message: '学生不存在' },
        { status: 404 }
      )
    }

    await prisma.student.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: '学生已删除' })
  } catch (error) {
    console.error('Delete student error:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
