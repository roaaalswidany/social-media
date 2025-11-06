import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/verifyToken'
import { UploadService } from '@/lib/upload'

type Params = { params: { id: string } }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: { select: { id: true, name: true, username: true, avatar: true } },
        likes: { select: { userId: true } },
        _count: { select: { likes: true, comments: true } }
      }
    })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    return NextResponse.json({ post })
  } catch (error) {
    console.error('Get post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const payload = await verifyTokenFromRequest(request)
    const existing = await prisma.post.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (existing.authorId !== payload.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const caption = (body.caption || '').trim()
    if (!caption) return NextResponse.json({ error: 'Caption required' }, { status: 400 })

    const post = await prisma.post.update({
      where: { id: params.id },
      data: { caption, updatedAt: new Date() },
      include: { author: { select: { id: true, name: true, username: true, avatar: true } }, _count: { select: { likes: true, comments: true } } }
    })

    return NextResponse.json({ message: 'Post updated', post })
  } catch (error) {
    console.error('Update post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const payload = await verifyTokenFromRequest(request)
    const existing = await prisma.post.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (existing.authorId !== payload.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (existing.image) {
      await UploadService.deleteImage(existing.image)
    }

    await prisma.like.deleteMany({ where: { postId: params.id } })
    await prisma.comment.deleteMany({ where: { postId: params.id } })
    await prisma.post.delete({ where: { id: params.id } })

    return NextResponse.json({ message: 'Post deleted' })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}