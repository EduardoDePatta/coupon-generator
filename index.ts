import { APIGatewayProxyEvent, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { config } from 'aws-sdk'
import { getCoupon, postCoupon, redeemCoupon } from './services/coupon'
import { BuildHttpResponse, BuildResponse, METHOD, PATH, RequestUtil } from './utils'

config.update({ region: 'eu-north-1' })

type RouteHandler = (event: APIGatewayProxyEvent) => Promise<BuildHttpResponse>

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
        const coupon = RequestUtil.parseRequestBody(event)
        return await postCoupon({ coupon })
      } catch (error) {
        return RequestUtil.buildResponse({
          statusCode: 400,
          message: 'Invalid JSON data',
          data: {}
        })
      }
    },
    [PATH.REDEEM]: async (event) => {
      try {
        return await redeemCoupon({ token: event.queryStringParameters?.token })
      } catch (error) {
        return RequestUtil.buildResponse({
          statusCode: 400,
          message: 'Invalid JSON data',
          data: {}
        })
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

  return RequestUtil.buildResponse({
    statusCode: 404,
    message: 'Not Found',
    data: { error: 'Not Found' }
  })
}
