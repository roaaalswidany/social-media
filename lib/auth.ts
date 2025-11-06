import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required in environment variables')
}

export interface JwtPayload {
  userId: string
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }
    const saltRounds = 12
    const hashed = await bcrypt.hash(password, saltRounds)
    return hashed
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    if (!hashedPassword) return false
    return bcrypt.compare(password, hashedPassword)
  }

  static generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET!, { expiresIn: '7d' })
  }

  static verifyTokenRaw(token: string): JwtPayload {
    // throws on invalid/expired
    const clean = token.replace('Bearer ', '')
    return jwt.verify(clean, JWT_SECRET!) as JwtPayload
  }
}