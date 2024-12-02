import { APIGatewayProxyEvent, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { config } from 'aws-sdk'
import { RequestUtil } from './utils'
import { routeMap } from './routeMap'

config.update({ region: process.env.REGION })

export const handler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2> => {
  const methodRoutes = routeMap[event.httpMethod]
  if (methodRoutes) {
    const routeHandler = methodRoutes[event.path]
    if (routeHandler) {
      const response = await routeHandler(event)
      return response
    }
  }

  return RequestUtil.buildResponse({
    statusCode: 404,
    message: 'Not Found',
    data: { error: 'Not Found' }
  })
}
