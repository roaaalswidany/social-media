import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/verifyToken'

export async function POST(request: NextRequest) {
  try {
    const payload = await verifyTokenFromRequest(request)
    const { searchParams } = new URL(request.url)
    const followingId = searchParams.get('userId')
    if (!followingId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
    if (followingId === payload.userId) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })

    const exist = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: payload.userId, followingId } } })
    if (exist) return NextResponse.json({ error: 'Already following' }, { status: 400 })

    const follow = await prisma.follow.create({ data: { followerId: payload.userId, followingId } })
    // notification
    await prisma.notification.create({ data: { type: 'follow', senderId: payload.userId, receiverId: followingId } })

    const followersCount = await prisma.follow.count({ where: { followingId } })
    return NextResponse.json({ message: 'Followed', follow, followersCount }, { status: 201 })
  } catch (error) {
    console.error('Follow error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await verifyTokenFromRequest(request)
    const { searchParams } = new URL(request.url)
    const followingId = searchParams.get('userId')
    if (!followingId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const exist = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: payload.userId, followingId } } })
    if (!exist) return NextResponse.json({ error: 'Not following' }, { status: 400 })

    await prisma.follow.delete({ where: { followerId_followingId: { followerId: payload.userId, followingId } } })
    const followersCount = await prisma.follow.count({ where: { followingId } })
    return NextResponse.json({ message: 'Unfollowed', followersCount })
  } catch (error) {
    console.error('Unfollow error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}