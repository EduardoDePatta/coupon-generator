import { APIGatewayProxyEvent } from 'aws-lambda'
import { ValidateEndpoint } from '../models'

export const validateEndpoint = (event: APIGatewayProxyEvent, { method, path }: ValidateEndpoint): boolean => {
  return event.httpMethod === method && event.path === path
}
