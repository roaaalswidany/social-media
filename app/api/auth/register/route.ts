import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, username } = await request.json()

    if (!email || !password || !name || !username) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    const hashedPassword = await AuthService.hashPassword(password)
    
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        username: username.toLowerCase(),
        bio: '',
        avatar: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        bio: true,
        avatar: true,
        createdAt: true,
      }
    })

    const token = AuthService.generateToken({ userId: user.id })

    return NextResponse.json({
      message: 'Account created successfully',
      user,
      token
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}