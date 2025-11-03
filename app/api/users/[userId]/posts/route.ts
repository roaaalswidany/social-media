/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

interface Context {
  params: {
    userId: string
  }
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const { userId } = context.params

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const posts = await prisma.post.findMany({
      where: { authorId: userId },
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
      where: { authorId: userId }
    })

    const hasMore = skip + posts.length < totalPosts

    let isLikedMap: Record<string, boolean> = {}
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (token) {
      try {
        const payload = AuthService.verifyToken(token)
        posts.forEach((post: { id: string | number; likes: any[] }) => {
          isLikedMap[post.id] = post.likes.some((like: { userId: string }) => like.userId === payload.userId)
        })
      } catch {
        // Ignore token error
      }
    }

    const formattedPosts = posts.map((post: { id: string | number }) => ({
      ...post,
      isLiked: isLikedMap[post.id] || false,
      likes: undefined
    }))

    return NextResponse.json({ 
      message: `Posts retrieved successfully for ${user.name}`,
      posts: formattedPosts,
      user: {
        id: user.id,
        name: user.name,
        username: user.username
      },
      pagination: {
        page,
        limit,
        total: totalPosts,
        hasMore
      }
    })
  } catch (error) {
    console.error('Get user posts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}