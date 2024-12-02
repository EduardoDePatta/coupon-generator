import * as crypto from 'crypto'
import * as zlib from 'zlib'
interface ValidateHMACToken {
  valid: boolean
  data?: object
  error?: string
}

interface IAuthUtil {
  generateHMACToken(data: object): string
  validateHMACToken(token: string): ValidateHMACToken
}
class AuthUtil implements IAuthUtil {
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
