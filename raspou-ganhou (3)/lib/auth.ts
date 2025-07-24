import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import type { NextRequest } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production"
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key-change-in-production"

export interface JWTPayload {
  userId: string
  email: string
  iat: number
  exp: number
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "15m" })
}

export function generateRefreshToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_REFRESH_SECRET, { expiresIn: "30d" })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  const rounds = Number.parseInt(process.env.BCRYPT_ROUNDS || "12")
  return bcrypt.hash(password, rounds)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7)
  }
  return null
}

export async function authenticateRequest(request: NextRequest) {
  const token = getTokenFromRequest(request)
  if (!token) {
    throw new Error("Token não fornecido")
  }

  const payload = verifyToken(token)
  if (!payload) {
    throw new Error("Token inválido")
  }

  return payload
}
