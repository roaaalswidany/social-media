import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/verifyToken'

type Params = { params: { id: string } }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: params.id },
      include: { author: { select: { id: true, name: true, username: true, avatar: true } } },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const payload = await verifyTokenFromRequest(request)
    const body = await request.json()
    if (!body?.content || body.content.trim() === '') return NextResponse.json({ error: 'Content required' }, { status: 400 })

    const post = await prisma.post.findUnique({ where: { id: params.id } })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const comment = await prisma.comment.create({
      data: { content: body.content.trim(), postId: params.id, authorId: payload.userId }
    })

    if (post.authorId !== payload.userId) {
      await prisma.notification.create({
        data: { type: 'comment', senderId: payload.userId, receiverId: post.authorId, postId: params.id, commentId: comment.id }
      })
    }

    return NextResponse.json({ message: 'Comment added', comment }, { status: 201 })
  } catch (error) {
    console.error('Add comment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}