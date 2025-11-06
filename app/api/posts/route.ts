/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/verifyToken'
import { UploadService } from '@/lib/upload'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      include: {
        author: { select: { id: true, name: true, username: true, avatar: true } },
        likes: { select: { userId: true } },
        _count: { select: { likes: true, comments: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const total = await prisma.post.count()
    const authHeader = request.headers.get('authorization')
    let currentUserId: string | null = null
    if (authHeader) {
      try {
        const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader
        const payload = (await import('@/lib/auth')).AuthService.verifyTokenRaw(token)
        currentUserId = payload.userId
      } catch {
        currentUserId = null
      }
    }

    const formatted = posts.map(p => ({
      ...p,
      isLiked: currentUserId ? p.likes.some(l => l.userId === currentUserId) : false,
      likes: undefined
    }))

    return NextResponse.json({ message: 'Posts', posts: formatted, pagination: { page, limit, total, hasMore: skip + posts.length < total } })
  } catch (error) {
    console.error('Get posts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyTokenFromRequest(request)
    const formData = await request.formData()
    const caption = formData.get('caption') as string
    const image = formData.get('image') as File | null

    if (!caption || caption.trim() === '') {
      return NextResponse.json({ error: 'Caption is required' }, { status: 400 })
    }

    let imageUrl: string | null = null
    if (image && image.size > 0) {
      imageUrl = await UploadService.uploadImage(image, payload.userId)
    }

    const post = await prisma.post.create({
      data: { caption: caption.trim(), image: imageUrl, authorId: payload.userId },
      include: { author: { select: { id: true, name: true, username: true, avatar: true } }, _count: { select: { likes: true, comments: true } } }
    })

    return NextResponse.json({ message: 'Post created', post }, { status: 201 })
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json({ error: (error as any).message || 'Internal server error' }, { status: 500 })
  }
}