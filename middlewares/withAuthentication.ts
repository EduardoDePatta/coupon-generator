import { APIGatewayProxyEvent } from 'aws-lambda'
import { BuildHttpResponse, RequestUtil } from '../utils'
import { IVerifyTokenMiddleware, VerifyTokenMiddleware } from '../middlewares/VerifyTokenMiddleware'
import { User } from './../services/auth/interfaces'

interface ValidTokenResponse {
  valid: true
  user: User
}

interface InvalidTokenResponse {
  valid: false
  error: string
}

type TokenValidationResult = ValidTokenResponse | InvalidTokenResponse

const withAuthentication = (verifyTokenMiddleware: IVerifyTokenMiddleware, handler: (event: APIGatewayProxyEvent, user: User) => Promise<BuildHttpResponse>) => {
  return async (event: APIGatewayProxyEvent): Promise<BuildHttpResponse> => {
    const tokenValidation = (await verifyTokenMiddleware.execute(event)) as TokenValidationResult

    if (!tokenValidation.valid) {
      return RequestUtil.buildResponse({
        statusCode: 401,
        message: tokenValidation.error || 'Unauthorized',
        data: null
      })
    }

    return handler(event, tokenValidation.user)
  }
}

export { withAuthentication }
