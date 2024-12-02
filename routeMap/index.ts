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
        userId: event.queryStringParameters?.userId
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
        const redeemCouponService = serviceFactory.redeemCouponService()
        return await redeemCouponService.execute({
          couponId: event.queryStringParameters?.couponId,
          regionId: event.queryStringParameters?.regionId,
          userId: event.queryStringParameters?.userId
        })
      } catch (error) {
        return RequestUtil.buildResponse({
          statusCode: 400,
          message: 'Invalid JSON data',
          data: {}
        })
      }
    },
    [PATH.LOGIN]: async (event) => {
      try {
        const loginParams = RequestUtil.parseRequestBody(event)
        const loginService = serviceFactory.loginService()
        return await loginService.execute(loginParams)
      } catch (error) {
        return RequestUtil.buildResponse({
          statusCode: 400,
          message: 'Invalid login request',
          data: {}
        })
      }
    }
  }
}

export { routeMap }
