import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'cet4-learning-default-secret-key-for-dev'

const secretKey = new TextEncoder().encode(JWT_SECRET)

export interface TokenPayload {
  id: string
  role: 'teacher' | 'student'
  name: string
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(secretKey)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey)
    return {
      id: payload.id as string,
      role: payload.role as 'teacher' | 'student',
      name: payload.name as string,
    }
  } catch {
    return null
  }
}

export async function getAuthUser(request: NextRequest): Promise<TokenPayload | null> {
  const token = request.cookies.get('auth-token')?.value
  if (!token) return null
  return verifyToken(token)
}
