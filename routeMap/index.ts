import { APIGatewayProxyEvent } from 'aws-lambda'
import { BuildHttpResponse, METHOD, PATH, RequestUtil } from '../utils'
import { getCoupon, postCoupon, redeemCoupon } from './../services/coupon'

type RouteHandler = (event: APIGatewayProxyEvent) => Promise<BuildHttpResponse>

const routeMap: { [method: string]: { [path: string]: RouteHandler } } = {
  [METHOD.GET]: {
    [PATH.COUPON]: async (event) => {
      return await getCoupon({
        couponId: event.queryStringParameters?.couponId,
        regionId: event.queryStringParameters?.regionId
      })
    },
    [PATH.REDEEM]: async (event) => {
      try {
        return await redeemCoupon({
          token: event.queryStringParameters?.token
        })
      } catch (error) {
        return RequestUtil.buildResponse({
          statusCode: 400,
          message: 'Invalid JSON data',
          data: {}
        })
      }
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
    }
  }
}

export { routeMap }
