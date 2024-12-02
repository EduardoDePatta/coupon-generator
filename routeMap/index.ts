import { APIGatewayProxyEvent } from 'aws-lambda'
import { AuthUtil, BuildHttpResponse, METHOD, PATH, RequestUtil } from '../utils'
import { serviceFactory } from './../services/factory/ServiceFactory'

type RouteHandler = (event: APIGatewayProxyEvent) => Promise<BuildHttpResponse>

const routeMap: { [method: string]: { [path: string]: RouteHandler } } = {
  [METHOD.GET]: {
    [PATH.COUPON]: async (event) => {
      const getCouponService = serviceFactory.getCouponService()
      return await getCouponService.execute({
        couponId: event.queryStringParameters?.couponId,
        regionId: event.queryStringParameters?.regionId
      })
    }
  },
  [METHOD.POST]: {
    [PATH.COUPON]: async (event) => {
      try {
        const coupon = RequestUtil.parseRequestBody(event)
        const postCouponService = serviceFactory.postCouponService()
        return await postCouponService.execute({ coupon })
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
        const auth = new AuthUtil()
        const redeemCouponService = serviceFactory.redeemCouponService()
        return await redeemCouponService.execute({
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
  }
}

export { routeMap }
