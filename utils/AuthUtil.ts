import * as crypto from 'crypto'
import * as zlib from 'zlib'
import * as jwt from 'jsonwebtoken'
import * as bcrypt from 'bcryptjs'
interface ValidateHMACToken {
  valid: boolean
  data?: object
  error?: string
}

interface IAuthUtil {
  generateHMACToken(data: object): string
  validateHMACToken(token: string): ValidateHMACToken
  generateJWT(payload: object): string
  validateJWT(token: string): { valid: boolean; data?: object; error?: string }
  hashPassword(password: string): Promise<string>
  comparePassword(password: string, hash: string): Promise<boolean>
}
class AuthUtil implements IAuthUtil {
  generateJWT(payload: object): string {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables')
    }

    return jwt.sign(payload, secret, { expiresIn: '1h' })
  }

  validateJWT(token: string): { valid: boolean; data?: object; error?: string } {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables')
    }

    try {
      const result = jwt.verify(token, secret)

      if (typeof result !== 'object' || result === null) {
        return { valid: false, error: 'Invalid JWT payload' }
      }

      return { valid: true, data: result }
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return { valid: false, error: 'Token has expired' }
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return { valid: false, error: 'Invalid JWT' }
      }

      return { valid: false, error: 'Unknown error while validating token' }
    }
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10)
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  generateHMACToken(data: object): string {
    const secret = process.env.HMAC_SECRET
    if (!secret) {
      throw new Error('HMAC is not defined in environment variables')
    }

    const payload = JSON.stringify(data)
    const compressedPayload = this.compressToken(payload)
    const signature = crypto.createHmac('sha256', secret).update(compressedPayload).digest('hex')
    return `${compressedPayload}.${signature}`
  }

  validateHMACToken(token: string): ValidateHMACToken {
    const [compressedPayload, signature] = token.split('.')
    const secret = process.env.HMAC_SECRET
    if (!secret || !compressedPayload || !signature) {
      return { valid: false, error: 'Invalid token format' }
    }

    const expectedSignature = crypto.createHmac('sha256', secret).update(compressedPayload).digest('hex')
    if (expectedSignature !== signature) {
      return { valid: false, error: 'Invalid token signature' }
    }

    try {
      const payload = this.decompressToken(compressedPayload)
      const data = JSON.parse(payload)
      return { valid: true, data }
    } catch (error) {
      return { valid: false, error: 'Invalid token payload' }
    }
  }

  private compressToken(payload: string): string {
    const compressed = zlib.gzipSync(payload)
    return compressed.toString('base64')
  }

  private decompressToken(base64: string): string {
    const buffer = Buffer.from(base64, 'base64')
    return zlib.gunzipSync(buffer).toString()
  }
}

export { AuthUtil, IAuthUtil }
