import * as crypto from 'crypto'

interface ValidateHMACToken {
  valid: boolean
  data?: object
  error?: string
}

class AuthUtil {
  static generateHMACToken(data: object): string {
    const secret = process.env.HMAC_SECRET
    if (!secret) {
      throw new Error('HMAC is not defined in environment variables')
    }

    const payload = Buffer.from(JSON.stringify(data)).toString('base64')
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    return `${payload}.${signature}`
  }

  static validateHMACToken(token: string): ValidateHMACToken {
    const secret = process.env.HMAC_SECRET
    if (!secret) {
      throw new Error('HMAC_SECRET is not defined in environment variables')
    }

    const [payload, signature] = token.split('.')

    if (!payload || !signature) {
      return { valid: false, error: 'Invalid token format' }
    }

    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    if (expectedSignature !== signature) {
      return { valid: false, error: 'Invalid token signature' }
    }

    try {
      const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'))
      return { valid: true, data }
    } catch {
      return { valid: false, error: 'Invalid token payload' }
    }
  }
}
export { AuthUtil }
