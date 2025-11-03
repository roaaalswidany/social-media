import { cookies } from 'next/headers'

export class CookieService {
  static async setToken(token: string) {
    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 
    })
  }

  static async getToken(): Promise<string | null> {
    const cookieStore = await cookies()
    return cookieStore.get('token')?.value || null
  }

  static async removeToken() {
    const cookieStore = await cookies()
    cookieStore.delete('token')
  }
}