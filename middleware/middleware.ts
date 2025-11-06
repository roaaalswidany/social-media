import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AuthService } from '@/lib/auth'

export function middleware(req: NextRequest) {
  const tokenFromCookie = req.cookies.get('token')?.value
  const authHeader = req.headers.get('authorization')
  const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader
  const token = tokenFromCookie || tokenFromHeader

  const protectedPrefixes = [
    '/api/posts',
    '/api/comments',
    '/api/notifications',
    '/api/feed',
    '/api/follow',
    '/api/users',
    '/api/auth/me',
  ]

  // allow public GET for some endpoints
  const publicGetPaths = [
    '/api/posts',          // GET all posts
    '/api/posts/',         // allow get post by id (GET /api/posts/:id)
  ]

  const path = req.nextUrl.pathname

  const isProtected = protectedPrefixes.some(p => path.startsWith(p))

  // If it's a protected path but a GET that is public allow
  if (isProtected) {
    // allow GET requests for public endpoints
    if (req.method === 'GET' && publicGetPaths.some(p => path.startsWith(p))) {
      return NextResponse.next()
    }
    // otherwise require token
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized - Token required' }, { status: 401 })
    }
    try {
      AuthService.verifyTokenRaw(token)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      const res = NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      res.cookies.delete('token')
      return res
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*']
}