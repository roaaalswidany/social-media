import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
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

    const totalPosts = await prisma.post.count()
    const hasMore = skip + posts.length < totalPosts

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedPosts = posts.map((post: { likes: any[] }) => ({
      ...post,
      isLiked: post.likes.some(like => {
        const token = request.headers.get('authorization')?.replace('Bearer ', '')
        if (!token) return false
        try {
          const payload = AuthService.verifyToken(token)
          return like.userId === payload.userId
        } catch {
          return false
        }
      }),
      likes: undefined
    }))

    return NextResponse.json({ 
      message: 'Posts retrieved successfully',
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total: totalPosts,
        hasMore
      }
    })
  } catch (error) {
    console.error('Get posts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Token required' },
        { status: 401 }
      )
    }

    const payload = AuthService.verifyToken(token)
    
    const formData = await request.formData()
    const caption = formData.get('caption') as string
    const image = formData.get('image') as File | null

    if (!caption || caption.trim() === '') {
      return NextResponse.json(
        { error: 'Caption is required' },
        { status: 400 }
      )
    }

    let imageUrl: string | null = null

    if (image && image.size > 0) {
      imageUrl = await UploadService.uploadImage(image, payload.userId)
    }

    const post = await prisma.post.create({
      data: {
        caption: caption.trim(),
        image: imageUrl,
        authorId: payload.userId
      },
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
            likes: true,
            comments: true
          }
        }
      }
    })

    return NextResponse.json({ 
      message: 'Post created successfully',
      post 
    }, { status: 201 })
  } catch (error) {
    console.error('Create post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}