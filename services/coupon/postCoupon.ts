import { dynamoDb, Tables } from '../../db'
import { RequestUtil } from './../../utils'

export const postCoupon = async ({ coupon }: { coupon: any }) => {
  try {
    await dynamoDb.put({ TableName: Tables.COUPONS, Item: coupon }).promise()
    return RequestUtil.buildResponse({
      statusCode: 200,
      data: coupon,
      message: 'Successfully created coupon.'
    })
  } catch {
    return RequestUtil.buildResponse({ statusCode: 500, message: 'Internal Server Error', data: {} })
  }
}
