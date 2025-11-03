import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

interface Context {
  params: {
    postId: string
  }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const { postId } = context.params
    
    const tokenFromCookie = request.cookies.get('token')?.value
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    const token = tokenFromCookie || tokenFromHeader
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - Token required' },
        { status: 401 }
      )
    }

    const payload = AuthService.verifyToken(token)
    const userId = payload.userId

    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    })

    if (existingLike) {
      return NextResponse.json(
        { error: 'Post already liked' },
        { status: 400 }
      )
    }

    const like = await prisma.like.create({
      data: {
        userId,
        postId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    })

    const likesCount = await prisma.like.count({
      where: { postId }
    })

    return NextResponse.json({ 
      message: 'Post liked successfully',
      like,
      likesCount 
    }, { status: 201 })
  } catch (error) {
    console.error('Like post error:', error)
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
    const userId = payload.userId

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    })

    if (!existingLike) {
      return NextResponse.json(
        { error: 'Post not liked' },
        { status: 400 }
      )
    }

    await prisma.like.delete({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    })

    const likesCount = await prisma.like.count({
      where: { postId }
    })

    return NextResponse.json({ 
      message: 'Post unliked successfully',
      likesCount 
    })
  } catch (error) {
    console.error('Unlike post error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}