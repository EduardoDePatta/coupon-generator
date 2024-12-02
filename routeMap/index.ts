import { APIGatewayProxyEvent } from 'aws-lambda'
import { BuildHttpResponse, METHOD, PATH, RequestUtil } from '../utils'
import { serviceFactory } from './../services/factory/ServiceFactory'
import { withAuthentication } from '../middlewares/withAuthentication'

type RouteHandler = (event: APIGatewayProxyEvent) => Promise<BuildHttpResponse>

const verifyTokenMiddleware = serviceFactory.verifyToken()

const routeMap: { [method: string]: { [path: string]: RouteHandler } } = {
  [METHOD.GET]: {
    [PATH.COUPON]: withAuthentication(verifyTokenMiddleware, async (event, user) => {
      const getCouponService = serviceFactory.getCouponService()
      return await getCouponService.execute({
        couponId: event.queryStringParameters?.couponId,
        userId: user.userId
      })
    })
  },
  [METHOD.POST]: {
    [PATH.COUPON]: withAuthentication(verifyTokenMiddleware, async (event, user) => {
      try {
        const coupon = RequestUtil.parseRequestBody(event)
        const postCouponService = serviceFactory.postCouponService()
        return await postCouponService.execute({ coupon, user })
      } catch (error) {
        return RequestUtil.buildResponse({
          statusCode: 400,
          message: 'Invalid JSON data',
          data: {}
        })
      }
    }),
    [PATH.REDEEM]: withAuthentication(verifyTokenMiddleware, async (event) => {
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
    }),
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
