import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/verifyToken'

type Params = { params: { id: string } } // id is postId

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const payload = await verifyTokenFromRequest(request)
    const postId = params.id

    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const existing = await prisma.like.findUnique({ where: { userId_postId: { userId: payload.userId, postId } } })
    if (existing) return NextResponse.json({ error: 'Already liked' }, { status: 400 })

    const like = await prisma.like.create({ data: { userId: payload.userId, postId } })

    if (post.authorId !== payload.userId) {
      await prisma.notification.create({
        data: { type: 'like', senderId: payload.userId, receiverId: post.authorId, postId }
      })
    }

    const likesCount = await prisma.like.count({ where: { postId } })
    return NextResponse.json({ message: 'Liked', like, likesCount }, { status: 201 })
  } catch (error) {
    console.error('Like error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const payload = await verifyTokenFromRequest(request)
    const postId = params.id

    const existing = await prisma.like.findUnique({ where: { userId_postId: { userId: payload.userId, postId } } })
    if (!existing) return NextResponse.json({ error: 'Not liked' }, { status: 400 })

    await prisma.like.delete({ where: { userId_postId: { userId: payload.userId, postId } } })
    const likesCount = await prisma.like.count({ where: { postId } })
    return NextResponse.json({ message: 'Unliked', likesCount })
  } catch (error) {
    console.error('Unlike error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}