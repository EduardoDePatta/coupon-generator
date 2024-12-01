export enum METHOD {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH'
}

export enum PATH {
  COUPONS = '/coupons',
  COUPON = '/coupon'
}

export interface BuildResponse<T = any> {
  statusCode: number
  body?: T
}

export interface ValidateEndpoint {
  method: METHOD
  path: PATH
}

export interface GetCouponsParams {
  couponId?: string
  regionId?: string
}
