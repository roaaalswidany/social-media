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
    console.log('Hashing password...')
    const saltRounds = 12
    const hashed = await bcrypt.hash(password, saltRounds)
    console.log('Password hashed. Length:', hashed.length)
    return hashed
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    console.log('Comparing passwords...')
    console.log('Input password:', password)
    console.log('Stored hash:', hashedPassword?.substring(0, 20) + '...')
    
    if (!hashedPassword) {
      console.log('No hashed password provided')
      return false
    }
    
    try {
      const isValid = await bcrypt.compare(password, hashedPassword)
      console.log('Password comparison result:', isValid)
      return isValid
    } catch (error) {
      console.error('Error comparing passwords:', error)
      return false
    }
  }

  static generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, JWT_SECRET!, { expiresIn: '7d' })  
  }

  static verifyToken(token: string): JwtPayload {
    try {
      const cleanToken = token.replace('Bearer ', '')
      return jwt.verify(cleanToken, JWT_SECRET!) as JwtPayload 
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token')
      } else if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired')
      }
      throw new Error('Token verification failed')
    }
  }
}