import { APIGatewayProxyEvent, APIGatewayProxyResultV2, Handler } from 'aws-lambda'

export const createCoupon: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2> => {
  const response = {
    statusCode: 200,
    body: 'Hello from lambda! 321'
  }
  return response
}
