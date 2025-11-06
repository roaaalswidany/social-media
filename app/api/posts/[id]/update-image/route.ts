/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTokenFromRequest } from '@/lib/verifyToken'
import { UploadService } from '@/lib/upload'

export async function POST(request: NextRequest, { params }: any) {
  try {
    const payload = await verifyTokenFromRequest(request)
    const postId = params.id
    const post = await prisma.post.findUnique({ where: { id: postId } })
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    if (post.authorId !== payload.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const formData = await request.formData()
    const image = formData.get('image') as File | null
    if (!image || image.size === 0) return NextResponse.json({ error: 'Image required' }, { status: 400 })

    // delete old
    if (post.image) await UploadService.deleteImage(post.image)
    const imageUrl = await UploadService.uploadImage(image, payload.userId)

    const updated = await prisma.post.update({ where: { id: postId }, data: { image: imageUrl, updatedAt: new Date() } })
    return NextResponse.json({ message: 'Image updated', post: updated })
  } catch (error) {
    console.error('Update image error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}