import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('FOLLOW USER START')
    
    const { searchParams } = new URL(request.url)
    const followingId = searchParams.get('userId')
    
    console.log('User ID to follow:', followingId)
    console.log('Full URL:', request.url)

    if (!followingId) {
      console.log('No userId provided')
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const tokenFromCookie = request.cookies.get('token')?.value
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
    const token = tokenFromCookie || tokenFromHeader
    
    console.log('Token sources - Cookie:', !!tokenFromCookie, 'Header:', !!tokenFromHeader)

    if (!token) {
      console.log('No token provided')
      return NextResponse.json(
        { error: 'Unauthorized - Token required' },
        { status: 401 }
      )
    }

    const payload = AuthService.verifyToken(token)
    const followerId = payload.userId
    console.log('Current user ID:', followerId)

    const userToFollow = await prisma.user.findUnique({
      where: { id: followingId },
      select: {
        id: true,
        name: true,
        username: true
      }
    })

    console.log('User to follow found:', userToFollow ? 'YES' : 'NO')

    if (!userToFollow) {
      console.log('User not found in database')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (followerId === followingId) {
      console.log('Cannot follow yourself')
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    })

    console.log('Existing follow:', existingFollow ? 'YES' : 'NO')

    if (existingFollow) {
      console.log('Already following this user')
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 400 }
      )
    }

    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true
          }
        }
      }
    })

    const followersCount = await prisma.follow.count({
      where: { followingId }
    })

    console.log('FOLLOW SUCCESSFUL!')
    console.log('Follow ID:', follow.id)
    console.log('Following user:', follow.following.name)
    console.log('Total followers:', followersCount)

    return NextResponse.json({ 
      message: 'User followed successfully',
      follow,
      followersCount 
    }, { status: 201 })

  } catch (error) {
    console.error('FOLLOW USER ERROR:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const followingId = searchParams.get('userId')

    console.log('UNFOLLOW USER')
    console.log('User ID to unfollow:', followingId)

    if (!followingId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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
    const followerId = payload.userId

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    })

    if (!existingFollow) {
      return NextResponse.json(
        { error: 'Not following this user' },
        { status: 400 }
      )
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    })

    const followersCount = await prisma.follow.count({
      where: { followingId }
    })

    console.log('Unfollow successful. Followers count:', followersCount)

    return NextResponse.json({ 
      message: 'User unfollowed successfully',
      followersCount 
    })
  } catch (error) {
    console.error('Unfollow user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}