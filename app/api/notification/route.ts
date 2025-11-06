import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/verifyToken'

export async function GET(request: NextRequest) {
  try {
    const payload = await verifyTokenFromRequest(request)
    const notifications = await prisma.notification.findMany({
      where: { receiverId: payload.userId },
      include: { sender: { select: { id: true, name: true, username: true, avatar: true } }, post: true, comment: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}