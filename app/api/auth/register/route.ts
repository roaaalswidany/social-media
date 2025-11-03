import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, username } = await request.json()

    console.log('Registration attempt for:', email)

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

    console.log('Hashing password...')
    const hashedPassword = await AuthService.hashPassword(password)
    console.log('Password hashed. Length:', hashedPassword.length)
    console.log('Hash:', hashedPassword)

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        username: username.toLowerCase(),
        bio: '',
        avatar: null
      }
      
    })

    console.log('User created in database. ID:', user.id)

    const verifiedUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        bio: true,
        avatar: true,
        createdAt: true,
        password: true  
      }
    })

    console.log('Verified user password in DB:', verifiedUser?.password ? 'EXISTS' : 'MISSING')

    const token = AuthService.generateToken({ userId: user.id })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = verifiedUser!

    return NextResponse.json({
      message: 'Account created successfully',
      user: userWithoutPassword,
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