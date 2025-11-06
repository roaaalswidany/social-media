import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest, { params }: any) {
  const followers = await prisma.follow.findMany({ where: { followingId: params.userId }, include: { follower: { select: { id: true, name: true, username: true, avatar: true } } } })
  return NextResponse.json({ followers })
}