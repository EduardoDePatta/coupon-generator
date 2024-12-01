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

const getCoupons = async ({ regionId, userId }: GetCouponsParams): Promise<BuildResponse> => {
  const params = {
    TableName: dyamoDbTableName,
    Key: {
      regionId: regionId,
      userId: userId
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
      response = await getCoupons({ userId: event.queryStringParameters?.userId, regionId: event.queryStringParameters?.regionId })
      break
    case validateEndpoint(event, { method: METHOD.POST, path: PATH.COUPON }):
      response = await postCoupon({ coupon: event.body })
  }

  return response
}

const validateEndpoint = (event: APIGatewayProxyEvent, { method, path }: ValidateEndpoint) => {
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

interface GetCouponsParams {
  userId?: string
  regionId?: string
}
