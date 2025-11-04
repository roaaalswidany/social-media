import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')
    
    console.log(' LIKE POST')
    console.log('Post ID from query:', postId)

    if (!postId) {
      console.log('No postId provided')
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    const tokenFromCookie = request.cookies.get('token')?.value
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    const token = tokenFromCookie || tokenFromHeader
    
    console.log('Token - Cookie:', !!tokenFromCookie, 'Header:', !!tokenFromHeader)
    
    if (!token) {
      console.log('No token provided')
      return NextResponse.json(
        { error: 'Unauthorized - Token required' },
        { status: 401 }
      )
    }

    const payload = AuthService.verifyToken(token)
    const userId = payload.userId
    console.log('User ID from token:', userId)

    console.log('Checking if post exists')
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    console.log('Post found:', post ? 'YES' : 'NO')
    if (post) {
      console.log('   - Post author:', post.authorId)
      console.log('   - Post caption:', post.caption?.substring(0, 50) + '...')
    }

    if (!post) {
      console.log('Post not found in database')
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    console.log('Checking for existing like')
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    })

    console.log('Existing like:', existingLike ? 'YES' : 'NO')

    if (existingLike) {
      console.log('Post already liked by user')
      return NextResponse.json(
        { error: 'Post already liked' },
        { status: 400 }
      )
    }

    console.log('Creating like in database')
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

    console.log('Like created successfully!')
    console.log('Like ID:', like.id)
    console.log('Total likes:', likesCount)

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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    console.log('UNLIKE POST')
    console.log('Post ID from query:', postId)

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

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

    console.log('Unlike successful. Total likes:', likesCount)

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