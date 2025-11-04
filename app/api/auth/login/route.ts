import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AuthService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    console.log('1. Starting login process')
    
    const body = await request.json()
    console.log('2. Request body:', body)
    
    const { email, password } = body
    console.log('3. Extracted email:', email, 'password:', password ? '***' : 'empty')

    if (!email || !password) {
      console.log('4. Missing fields - email:', !!email, 'password:', !!password)
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    console.log('5. Searching for user in database')
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    console.log('6. User search result:', user)

    if (!user) {
      console.log('7. User not found')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('8. User found, comparing passwords')
    const isPasswordValid = await AuthService.comparePassword(password, user.password)
    console.log('9. Password validation result:', isPasswordValid)
    
    if (!isPasswordValid) {
      console.log('10. Password invalid')
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    console.log('11. Generating token')
    const token = AuthService.generateToken({ userId: user.id })

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user

    console.log('12. Login successful, sending response')

    const response = NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7
    })

    console.log('13. Response sent successfully')
    return response

  } catch (error) {
    console.error('14. LOGIN ERROR:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}