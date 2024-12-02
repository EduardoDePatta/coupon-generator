import { dynamoDb, Tables } from '../../db'
import { BuildHttpResponse, IAuthUtil, IValidatorUtil, RequestUtil, ValidationRules } from './../../utils'
import { Coupon } from './interfaces'

enum ErrorType {
  ConditionalCheckFailedException = 'ConditionalCheckFailedException'
}
export interface RedeemCouponParams {
  userId?: string
  regionId?: string
  couponId?: string
}

export interface IRedeemCouponService {
  execute(params: RedeemCouponParams): Promise<BuildHttpResponse>
}

class RedeemCouponService implements IRedeemCouponService {
  constructor(private readonly validator: IValidatorUtil, private readonly auth: IAuthUtil) {}
  public async execute({ couponId, regionId, userId }: RedeemCouponParams) {
    try {
      this.validator.validateFields({ couponId, regionId, userId }, ['couponId', 'regionId', 'userId'], {
        couponId: ValidationRules.isNonEmptyString,
        regionId: ValidationRules.isNonEmptyString,
        userId: ValidationRules.isNonEmptyString
      })

      const couponResponse = await dynamoDb
        .get({
          TableName: Tables.COUPONS,
          Key: {
            userId,
            couponId
          }
        })
        .promise()

      const coupon = couponResponse.Item
      console.log('🚀 ~ RedeemCouponService ~ execute ~ coupon:', coupon)

      if (!coupon || !coupon.createdAt || new Date(coupon.expiresAt) < new Date()) {
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
            userId: coupon.userId,
            couponId: coupon.couponId
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
          userId: coupon.userId,
          regionId: coupon.regionId,
          couponId: coupon.couponId,
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
