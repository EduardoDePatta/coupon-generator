import { dynamoDb, Tables } from '../../db'
import { BuildHttpResponse, IAuthUtil, RequestUtil } from './../../utils'
import { Coupon } from './interfaces'

enum ErrorType {
  ConditionalCheckFailedException = 'ConditionalCheckFailedException'
}
export interface RedeemCouponParams {
  token?: string
}

export interface IRedeemCouponService {
  execute(params: RedeemCouponParams): Promise<BuildHttpResponse>
}

class RedeemCouponService implements IRedeemCouponService {
  constructor(private auth: IAuthUtil) {}
  public async execute({ token }: { token?: string }) {
    try {
      if (!token) {
        return RequestUtil.buildResponse({
          statusCode: 400,
          message: 'Token is required',
          data: null
        })
      }

      const tokenValidation = this.auth.validateHMACToken(token)

      if (!tokenValidation.valid) {
        return RequestUtil.buildResponse({
          statusCode: 400,
          message: tokenValidation.error || 'Invalid token',
          data: null
        })
      }

      const tokenData = tokenValidation.data as Coupon

      if (!tokenData.expiresAt) {
        throw new Error('Token does not contain expiration date')
      }

      if (new Date(tokenData.expiresAt) < new Date()) {
        return RequestUtil.buildResponse({
          statusCode: 400,
          message: 'Coupon has expired',
          data: null
        })
      }

      await dynamoDb
        .update({
          TableName: Tables.COUPONS,
          Key: {
            regionId: tokenData.regionId,
            couponId: tokenData.couponId
          },
          UpdateExpression: 'SET used = :used',
          ExpressionAttributeValues: {
            ':used': true,
            ':notUsed': false
          },
          ConditionExpression: 'attribute_exists(couponId) AND used = :notUsed'
        })
        .promise()

      return RequestUtil.buildResponse({
        statusCode: 200,
        message: 'Coupon redeemed successfully',
        data: {
          userId: tokenData.userId,
          regionId: tokenData.regionId,
          couponId: tokenData.couponId,
          used: true
        }
      })
    } catch (error: any) {
      if (error.code === ErrorType.ConditionalCheckFailedException) {
        return RequestUtil.buildResponse({
          statusCode: 400,
          message: 'Coupon has already been redeemed or does not exist',
          data: null
        })
      }

      return RequestUtil.buildResponse({
        statusCode: 500,
        message: error.message || 'Internal Server Error',
        data: null
      })
    }
  }
}

export { RedeemCouponService }
