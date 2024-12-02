import { APIGatewayProxyEvent } from 'aws-lambda'
import { BuildHttpResponse, IAuthUtil, RequestUtil } from '../utils'

interface IVerifyTokenMiddleware {
  execute(event: APIGatewayProxyEvent): Promise<BuildHttpResponse | { valid: true; user: object } | { valid: false; error: string }>
}

class VerifyTokenMiddleware implements IVerifyTokenMiddleware {
  constructor(private readonly auth: IAuthUtil) {}

  public async execute(event: APIGatewayProxyEvent): Promise<BuildHttpResponse | { valid: true; user: object } | { valid: false; error: string }> {
    try {
      const token = this.extractToken(event)
      if (!token) {
        return RequestUtil.buildResponse({
          statusCode: 401,
          message: 'Token is required',
          data: null
        })
      }

      const validation = this.auth.validateJWT(token)

      if (!validation.valid) {
        return { valid: false, error: validation.error || 'Invalid token' }
      }

      return { valid: true, user: validation.data as object }
    } catch (error) {
      return RequestUtil.buildResponse({
        statusCode: 500,
        message: 'Internal server error during token validation',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
    }
  }

  private extractToken(event: APIGatewayProxyEvent): string | null {
    const authorizationHeader = event.headers?.Authorization || event.headers?.authorization
    if (!authorizationHeader) return null

    const token = authorizationHeader.split(' ')[1]
    return token || null
  }
}

export { VerifyTokenMiddleware, IVerifyTokenMiddleware }
