import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/verifyToken'

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyTokenFromRequest(request)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const following = await prisma.follow.findMany({ where: { followerId: payload.userId }, select: { followingId: true } })
    const ids = following.map(f => f.followingId)
    // include own posts too
    const posts = await prisma.post.findMany({
      where: { OR: [{ authorId: payload.userId }, { authorId: { in: ids } }] },
      skip,
      take: limit,
      include: { author: { select: { id: true, name: true, username: true, avatar: true } }, likes: { select: { userId: true } }, _count: { select: { likes: true, comments: true } } },
      orderBy: { createdAt: 'desc' }
    })

    const total = await prisma.post.count({ where: { OR: [{ authorId: payload.userId }, { authorId: { in: ids } }] } })
    const formatted = posts.map(p => ({ ...p, isLiked: p.likes.some(l => l.userId === payload.userId), likes: undefined }))

    return NextResponse.json({ message: 'Feed', posts: formatted, pagination: { page, limit, total, hasMore: skip + posts.length < total } })
  } catch (error) {
    console.error('Feed error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}