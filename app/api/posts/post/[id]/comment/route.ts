/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await context.params
    return NextResponse.json({ message: 'Comments', postId })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await context.params
    return NextResponse.json({ message: 'Comment created', postId })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}