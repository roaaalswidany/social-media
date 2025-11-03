import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'
import { UploadService } from '@/lib/upload'

interface Context {
  params: {
    postId: string
  }
}

export async function GET(request: NextRequest, context: Context) {
  try {
    const { postId } = context.params

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            bio: true
          }
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true
              }
            }
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

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    let isLiked = false
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (token) {
      try {
        const payload = AuthService.verifyToken(token)
        isLiked = post.likes.some((like: { userId: string }) => like.userId === payload.userId)
      } catch {
        // Ignore token error
      }
    }

    return NextResponse.json({ 
      message: 'Post retrieved successfully',
      post: {
        ...post,
        isLiked
      }
    })
  } catch (error) {
    console.error('Get post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    const { postId } = context.params
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Token required' },
        { status: 401 }
      )
    }

    const payload = AuthService.verifyToken(token)

    const existingPost = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    if (existingPost.authorId !== payload.userId) {
      return NextResponse.json(
        { error: 'Not authorized to edit this post' },
        { status: 403 }
      )
    }

    const { caption } = await request.json()

    if (!caption || caption.trim() === '') {
      return NextResponse.json(
        { error: 'Caption is required' },
        { status: 400 }
      )
    }

    const post = await prisma.post.update({
      where: { id: postId },
      data: { 
        caption: caption.trim(),
        updatedAt: new Date()
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
      message: 'Post updated successfully',
      post 
    })
  } catch (error) {
    console.error('Update post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const { postId } = context.params
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Token required' },
        { status: 401 }
      )
    }

    const payload = AuthService.verifyToken(token)

    const existingPost = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

if (existingPost.authorId !== payload.userId) {
      return NextResponse.json(
        { error: 'Not authorized to delete this post' },
        { status: 403 }
      )
    }

    if (existingPost.image) {
      await UploadService.deleteImage(existingPost.image)
    }

    await prisma.like.deleteMany({
      where: { postId }
    })

    await prisma.post.delete({
      where: { id: postId }
    })

    return NextResponse.json({ 
      message: 'Post deleted successfully' 
    })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}