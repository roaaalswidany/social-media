/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/verifyToken'
import { UploadService } from '@/lib/upload'


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, username: true, avatar: true } },
        likes: { select: { userId: true } },
        _count: { select: { likes: true, comments: true } }
      }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Post retrieved', post })
  } catch (error) {
    console.error('Get post error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const payload = await verifyTokenFromRequest(request)
    const { caption } = await request.json()

    if (!caption || caption.trim() === '') {
      return NextResponse.json({ error: 'Caption is required' }, { status: 400 })
    }

    const existingPost = await prisma.post.findUnique({ where: { id } })
    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (existingPost.authorId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: { caption: caption.trim() },
      include: {
        author: { select: { id: true, name: true, username: true, avatar: true } },
        _count: { select: { likes: true, comments: true } }
      }
    })

    return NextResponse.json({ message: 'Post updated', post: updatedPost })
  } catch (error) {
    console.error('Update post error:', error)
    return NextResponse.json(
      { error: (error as any).message || 'Internal server error' },
      { status: 500 }
    )
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const payload = await verifyTokenFromRequest(request)

    const existingPost = await prisma.post.findUnique({ where: { id } })
    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    if (existingPost.authorId !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (existingPost.image) {
      await UploadService.deleteImage(existingPost.image)
    }

    await prisma.post.delete({ where: { id } })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json(
      { error: (error as any).message || 'Internal server error' },
      { status: 500 }
    )
  }
}