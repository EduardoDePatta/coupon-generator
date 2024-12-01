import { DynamoDB } from 'aws-sdk'
import { BuildResponse, GetCouponsParams } from '../models'
import { buildResponse } from '../utils/responseBuilder'

const dynamoDb = new DynamoDB.DocumentClient()
const dyamoDbTableName: string = 'coupons'

export const getCoupons = async ({ regionId, couponId }: GetCouponsParams): Promise<BuildResponse> => {
  const params = {
    TableName: dyamoDbTableName,
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

export const postCoupon = async ({ coupon }: { coupon: any }) => {
  const params = {
    TableName: dyamoDbTableName,
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
