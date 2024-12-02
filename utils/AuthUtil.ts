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

    const payload = JSON.stringify(data)
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    return `${payload}.${signature}`
  }

  static validateHMACToken(token: string): ValidateHMACToken {
    console.log('🚀 ~ AuthUtil ~ validateHMACToken ~ token:', token)
    const secret = process.env.HMAC_SECRET
    if (!secret) {
      throw new Error('HMAC_SECRET is not defined in environment variables')
    }

    const [payload, signature] = token.split('.')
    console.log('🚀 ~ AuthUtil ~ validateHMACToken ~ signature:', signature)
    console.log('🚀 ~ AuthUtil ~ validateHMACToken ~ payload:', payload)

    if (!payload || !signature) {
      return { valid: false, error: 'Invalid token format' }
    }

    const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    console.log('🚀 ~ AuthUtil ~ validateHMACToken ~ expectedSignature:', expectedSignature)
    if (expectedSignature !== signature) {
      console.log('nesse aqui')
      return { valid: false, error: 'Invalid token signature' }
    }

    try {
      const data = JSON.parse(payload)
      console.log('🚀 ~ AuthUtil ~ validateHMACToken ~ data:', data)
      return { valid: true, data }
    } catch {
      return { valid: false, error: 'Invalid token payload' }
    }
  }
}
export { AuthUtil }
