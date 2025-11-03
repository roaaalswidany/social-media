/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthService } from '../lib/auth'

export function middleware(request: NextRequest) {
  const tokenFromCookie = request.cookies.get('token')?.value
  const authHeader = request.headers.get('authorization')
  const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  
  const token = tokenFromCookie || tokenFromHeader

  const protectedRoutes = [
    '/api/posts',
    '/api/users',
    '/api/auth/me'
  ]

  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/posts?', 
  ]

  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname.includes(route) ||
    (request.nextUrl.pathname === '/api/posts' && request.method === 'GET')
  )

  if (isProtectedRoute && !isPublicRoute) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - Token required' }, { status: 401 })
    }

    try {
      AuthService.verifyToken(token)
    } catch (error) {
      const response = NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      response.cookies.delete('token')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!api/auth/login|api/auth/register).*)'
  ]
}