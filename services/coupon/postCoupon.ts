import { dynamoDb, Tables } from '../../db'
import { AuthUtil, RequestUtil, ValidationRules, ValidatorUtil } from './../../utils'
import { v4 as uuidv4 } from 'uuid'
export interface Coupon {
  userId: string
  regionId: string
  restaurantId: string
  productCode: string
  discountValue: number
  couponId?: string
  token?: string
  expiresAt?: string
  used?: boolean
}

interface MakeTokenDataParams {
  coupon: Coupon
  couponId: string
  expiresAt: string
}

function makeTokenData({ coupon, couponId, expiresAt }: MakeTokenDataParams) {
  return {
    userId: coupon.userId,
    regionId: coupon.regionId,
    restaurantId: coupon.restaurantId,
    productCode: coupon.productCode,
    discountValue: coupon.discountValue,
    couponId,
    expiresAt
  }
}

interface MakeItemToSaveParams {
  coupon: Coupon
  couponId: string
  token: string
  expiresAt: string
}

function makeItemToSave({ coupon, couponId, token, expiresAt }: MakeItemToSaveParams): Coupon {
  return {
    ...coupon,
    couponId,
    regionId: coupon.regionId,
    token,
    expiresAt,
    used: false
  }
}

export const postCoupon = async ({ coupon }: { coupon: Coupon }) => {
  try {
    ValidatorUtil.validateFields<Coupon>(coupon, ['userId', 'regionId', 'restaurantId', 'productCode', 'discountValue'], {
      discountValue: ValidationRules.isPositiveNumber,
      userId: ValidationRules.isNonEmptyString,
      regionId: ValidationRules.isNonEmptyString,
      restaurantId: ValidationRules.isNonEmptyString,
      productCode: ValidationRules.isNonEmptyString
    })

    const couponId = uuidv4()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const tokenData = makeTokenData({ coupon, couponId, expiresAt })
    const token = AuthUtil.generateHMACToken(tokenData)
    console.log('🚀 ~ postCoupon ~ token:', token)

    const itemToSave = makeItemToSave({ coupon, couponId, token, expiresAt })

    await dynamoDb.put({ TableName: Tables.COUPONS, Item: itemToSave }).promise()

    return RequestUtil.buildResponse({
      statusCode: 200,
      data: coupon,
      message: 'Successfully created coupon.'
    })
  } catch (error) {
    return RequestUtil.buildResponse({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      data: {}
    })
  }
}
