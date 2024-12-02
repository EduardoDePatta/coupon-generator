import { dynamoDb, Tables } from '../../db'
import { BuildResponse } from '../../models'
import { buildResponse } from '../../utils'

export interface GetCouponParams {
  couponId?: string
  regionId?: string
}

export const getCoupon = async ({ regionId, couponId }: GetCouponParams): Promise<BuildResponse> => {
  const params = {
    TableName: Tables.COUPONS,
    Key: {
      regionId,
      couponId
    }
  }

  try {
    const response = await dynamoDb.get(params).promise()
    return buildResponse({ statusCode: 200, body: response.Item })
  } catch (error) {
    return buildResponse({ statusCode: 500, body: { error: 'Internal Server Error' } })
  }
}
