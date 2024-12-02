import { APIGatewayProxyEvent, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { config } from 'aws-sdk'
import { METHOD, PATH, BuildResponse } from './models'
import { buildResponse } from './utils/responseBuilder'
import { getCoupon, postCoupon } from './services/coupon'

config.update({ region: 'eu-north-1' })

type RouteHandler = (event: APIGatewayProxyEvent) => Promise<BuildResponse>

const routeMap: { [method: string]: { [path: string]: RouteHandler } } = {
  [METHOD.GET]: {
    [PATH.COUPON]: async (event) => {
      return await getCoupon({
        couponId: event.queryStringParameters?.couponId,
        regionId: event.queryStringParameters?.regionId
      })
    }
  },
  [METHOD.POST]: {
    [PATH.COUPON]: async (event) => {
      try {
        const body = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf-8') : event.body
        const coupon = JSON.parse(body || '{}')
        return await postCoupon({ coupon })
      } catch (error) {
        return buildResponse({ statusCode: 400, body: { error: 'Invalid JSON body' } })
      }
    }
  }
}

export const handler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2> => {
  const methodRoutes = routeMap[event.httpMethod]
  if (methodRoutes) {
    const routeHandler = methodRoutes[event.path]
    if (routeHandler) {
      const response = await routeHandler(event)
      return response
    }
  }

  return buildResponse({ statusCode: 404, body: { error: 'Not Found' } })
}
