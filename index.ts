import { APIGatewayProxyEvent, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { createCoupon } from './functions/createCoupon/handler'

type RouteKey = `${string}:${string}`

const routeHandlers: Record<RouteKey, Handler> = {
  '/coupons:GET': createCoupon
}

export const handler: Handler = async (event: APIGatewayProxyEvent, context, callback): Promise<APIGatewayProxyResultV2> => {
  const { path, httpMethod } = event

  const routeKey = `${path}:${httpMethod}` as RouteKey
  const routeHandler = routeHandlers[routeKey]

  if (routeHandler) {
    return await routeHandler(event, context, callback)
  } else {
    return {
      statusCode: 404,
      body: 'Not Found'
    }
  }
}
