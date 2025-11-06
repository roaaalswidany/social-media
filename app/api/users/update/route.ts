/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/verifyToken'
import { UploadService } from '@/lib/upload'

export async function PATCH(request: NextRequest) {
  try {
    const payload = await verifyTokenFromRequest(request)
    const formData = await request.formData()
    const name = formData.get('name') as string | null
    const username = formData.get('username') as string | null
    const bio = formData.get('bio') as string | null
    const avatar = formData.get('avatar') as File | null

    const updates: any = {}
    if (name) updates.name = name
    if (username) updates.username = username.toLowerCase()
    if (bio !== null) updates.bio = bio

    if (avatar && avatar.size > 0) {
      // delete old avatar
      const user = await prisma.user.findUnique({ where: { id: payload.userId } })
      if (user?.avatar) await UploadService.deleteImage(user.avatar)
      const avatarUrl = await UploadService.uploadImage(avatar, payload.userId)
      updates.avatar = avatarUrl
    }

    const updated = await prisma.user.update({ where: { id: payload.userId }, data: updates, select: { id: true, name: true, username: true, bio: true, avatar: true } })
    return NextResponse.json({ message: 'Profile updated', user: updated })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}