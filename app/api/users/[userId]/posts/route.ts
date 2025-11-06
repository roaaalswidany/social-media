import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/verifyToken'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest, { params }: any) {
  try {
    const userId = params.userId
    const page = parseInt(new URL(request.url).searchParams.get('page') || '1')
    const limit = parseInt(new URL(request.url).searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      skip,
      take: limit,
      include: { author: { select: { id: true, name: true, username: true, avatar: true } }, likes: { select: { userId: true } }, _count: { select: { likes: true, comments: true } } },
      orderBy: { createdAt: 'desc' }
    })

    const total = await prisma.post.count({ where: { authorId: userId } })

    // optional token to mark isLiked
    let currentUserId: string | null = null
    try {
      const payload = await verifyTokenFromRequest(request)
      currentUserId = payload.userId
    } catch { currentUserId = null }

    const formatted = posts.map(p => ({ ...p, isLiked: currentUserId ? p.likes.some(l => l.userId === currentUserId) : false, likes: undefined }))

    return NextResponse.json({ message: `Posts retrieved for ${userId}`, posts: formatted, pagination: { page, limit, total, hasMore: skip + posts.length < total } })
  } catch (error) {
    console.error('Get user posts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}