import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/verifyToken'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function PUT(request: NextRequest, { params }: any) {
  try {
    const payload = await verifyTokenFromRequest(request)
    await prisma.notification.updateMany({ where: { id: params.id, receiverId: payload.userId }, data: { read: true } })
    return NextResponse.json({ message: 'Marked as read' })
  } catch (error) {
    console.error('Mark read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}