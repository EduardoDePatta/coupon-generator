import { dynamoDb, Tables } from '../../db'
import { buildResponse } from '../../utils'

export const postCoupon = async ({ coupon }: { coupon: any }) => {
  const params = {
    TableName: Tables.COUPONS,
    Item: coupon
  }

  try {
    await dynamoDb.put(params).promise()
    const body = {
      Operation: 'SAVE',
      Message: 'SUCCESS',
      Item: coupon
    }
    return buildResponse({ statusCode: 200, body })
  } catch (error) {
    return buildResponse({ statusCode: 500, body: { error: 'Internal Server Error' } })
  }
}
