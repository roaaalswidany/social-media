import { NextRequest } from 'next/server'
import { AuthService } from './auth'

export async function verifyTokenFromRequest(req: NextRequest) {
  const tokenFromCookie = req.cookies.get('token')?.value
  const authHeader = req.headers.get('authorization')
  const tokenFromHeader = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader

  const token = tokenFromCookie || tokenFromHeader
  if (!token) throw new Error('Token required')

  const payload = AuthService.verifyTokenRaw(token)
  return payload
}