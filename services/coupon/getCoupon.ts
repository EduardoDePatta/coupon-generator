import { dynamoDb, Tables } from '../../db'
import { BuildResponse, RequestUtil } from '../../utils'

export interface GetCouponParams {
  couponId?: string
  regionId?: string
}

export const getCoupon = async ({ regionId, couponId }: GetCouponParams) => {
  try {
    const response = await dynamoDb
      .get({
        TableName: Tables.COUPONS,
        Key: {
          regionId,
          couponId
        }
      })
      .promise()

    return RequestUtil.buildResponse({
      statusCode: 200,
      message: 'Coupon retrieved successfully',
      data: response.Item
    })
  } catch (error) {
    return RequestUtil.buildResponse({
      statusCode: 500,
      message: 'Internal server error occurred',
      data: { error: 'Internal Server Error' }
    })
  }
}
