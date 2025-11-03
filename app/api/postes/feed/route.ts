import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Token required' },
        { status: 401 }
      )
    }

    const payload = AuthService.verifyToken(token)

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const following = await prisma.follow.findMany({
      where: { followerId: payload.userId },
      select: { followingId: true }
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const followingIds = following.map((f: { followingId: any }) => f.followingId)

    if (followingIds.length === 0) {
      return NextResponse.json({ 
        message: 'You are not following any users yet',
        posts: [],
        pagination: {
          page,
          limit,
          total: 0,
          hasMore: false
        }
      })
    }

    const posts = await prisma.post.findMany({
      where: {
        authorId: {
          in: followingIds
        }
      },
      skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
          }
        },
        likes: {
          where: {
            userId: payload.userId
          },
          select: {
            userId: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const totalPosts = await prisma.post.count({
      where: {
        authorId: {
          in: followingIds
        }
      }
    })

    const hasMore = skip + posts.length < totalPosts

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedPosts = posts.map((post: { likes: string | any[] }) => ({
      ...post,
      isLiked: post.likes.length > 0,
      likes: undefined
    }))

    return NextResponse.json({ 
      message: 'Feed retrieved successfully',
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total: totalPosts,
        hasMore
      }
    })
  } catch (error) {
    console.error('Get feed error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}