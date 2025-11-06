/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const isValid = await AuthService.comparePassword(password, user.password)
    if (!isValid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const token = AuthService.generateToken({ userId: user.id })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { password: _, ...userSafe } = user as any

    const response = NextResponse.json({ message: 'Login successful', user: userSafe, token })
    response.cookies.set('token', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 })
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}