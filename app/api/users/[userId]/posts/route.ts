import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Context {
  params: {
    userId: string
  }
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const { userId } = context.params

    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
          }
        },
        _count: {
          select: {
            likes: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Get user posts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}