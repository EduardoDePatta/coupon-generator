import { APIGatewayProxyEvent } from 'aws-lambda'

export enum METHOD {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH'
}

export enum PATH {
  COUPONS = '/coupons',
  COUPON = '/coupon',
  REDEEM = '/redeem'
}

export interface BuildResponse<T = any> {
  statusCode: number
  data?: T
  message: string
}

export interface BuildHttpResponse {
  statusCode: number
  headers: { 'Content-Type': string }
  body: string
}

export interface ValidateEndpoint {
  method: METHOD
  path: PATH
}

class RequestUtil {
  static parseRequestBody(event: APIGatewayProxyEvent) {
    try {
      const body = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf-8') : event.body
      return JSON.parse(body || '{}')
    } catch (error) {
      throw new Error('Invalid JSON body')
    }
  }

  static buildResponse<T>({ data, statusCode, message }: BuildResponse<T>): BuildHttpResponse {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data, message })
    }
  }

  static validateEndpoint(event: APIGatewayProxyEvent, { method, path }: ValidateEndpoint): boolean {
    return event.httpMethod === method && event.path === path
  }
}

export { RequestUtil }
