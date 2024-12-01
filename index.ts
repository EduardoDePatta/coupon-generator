import { APIGatewayProxyEvent, APIGatewayProxyResultV2, Handler } from 'aws-lambda'
import { config, DynamoDB } from 'aws-sdk'

config.update({
  region: 'eu-north-1'
})

interface BuildResponse<T = any> {
  statusCode: number
  body?: T
}

enum METHOD {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH'
}

enum PATH {
  COUPONS = '/coupons',
  COUPON = '/coupon'
}

interface ValidateEndpoint {
  method: METHOD
  path: PATH
}

const dynamoDb = new DynamoDB.DocumentClient()
const dyamoDbTableName: string = 'coupons'

const validateEndpoint = (event: APIGatewayProxyEvent, { method, path }: ValidateEndpoint): boolean => {
  return event.httpMethod === method && event.path === path
}

const buildResponse = ({ body, statusCode }: BuildResponse) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
}

const getCoupons = async ({ regionId, couponId }: GetCouponsParams): Promise<BuildResponse> => {
  const params = {
    TableName: dyamoDbTableName,
    Key: {
      regionId,
      couponId
    }
  }

  const response = await dynamoDb
    .get(params)
    .promise()
    .then((response) => {
      return buildResponse({ statusCode: 200, body: response.Item })
    })
  return response
}

const postCoupon = async ({ coupon }: { coupon: any }) => {
  console.log('🚀 ~ postCoupon ~ coupon:', coupon)
  const params = {
    TableName: dyamoDbTableName,
    Item: coupon
  }
  return await dynamoDb
    .put(params)
    .promise()
    .then(() => {
      const body = {
        Operation: 'SAVE',
        Message: 'SUCCESS',
        Item: coupon
      }
      return buildResponse({ statusCode: 200, body })
    })
    .catch((error) => {
      console.error('put error:', error)
      return buildResponse({ statusCode: 500, body: { error: 'internal server error ' + error } })
    })
}

export const handler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2> => {
  let response: BuildResponse = {
    statusCode: 403,
    body: JSON.stringify({
      method: event.httpMethod,
      path: event.path
    })
  }
  console.log(event.httpMethod, event.path)

  switch (true) {
    case validateEndpoint(event, { method: METHOD.GET, path: PATH.COUPON }):
      response = buildResponse({ statusCode: 200 })
      break
    case validateEndpoint(event, { method: METHOD.GET, path: PATH.COUPONS }):
      response = await getCoupons({ couponId: event.queryStringParameters?.couponId, regionId: event.queryStringParameters?.regionId })
      break
    case validateEndpoint(event, { method: METHOD.POST, path: PATH.COUPON }):
      try {
        const body = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf-8') : event.body
        const coupon = JSON.parse(body || '{}')
        console.log('Coupon Decoded:', coupon)

        response = await postCoupon({ coupon })
      } catch (error) {
        console.error('Error Parsing Body:', error)
        response = buildResponse({ statusCode: 400, body: { error: 'Invalid JSON body' } })
      }
      break
  }

  return response
}

interface GetCouponsParams {
  couponId?: string
  regionId?: string
}
