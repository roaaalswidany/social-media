import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/verifyToken'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function DELETE(request: NextRequest, { params }: any) {
  try {
    const payload = await verifyTokenFromRequest(request)
    const comment = await prisma.comment.findUnique({ where: { id: params.id } })
    if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (comment.authorId !== payload.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.comment.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Comment deleted' })
  } catch (error) {
    console.error('Delete comment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}