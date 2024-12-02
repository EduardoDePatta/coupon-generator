import { dynamoDb, Tables } from '../../db'
import { RequestUtil, ValidationRules, ValidatorUtil } from './../../utils'
import { v4 as uuidv4 } from 'uuid'
export interface Coupon {
  userId: string
  regionId: string
  restaurantId: string
  productCode: string
  discountValue: number
  couponId?: string
  token?: string
}

interface MakeTokenDataParams {
  coupon: Coupon
  couponId: string
}
function makeTokenData({ coupon, couponId }: MakeTokenDataParams) {
  return {
    userId: coupon.userId,
    regionId: coupon.regionId,
    restaurantId: coupon.restaurantId,
    productCode: coupon.productCode,
    discountValue: coupon.discountValue,
    couponId
  }
}

interface MakeItemToSaveParams {
  coupon: Coupon
  couponId: string
  token: string
}
function makeItemToSave({ coupon, couponId, token }: MakeItemToSaveParams) {
  return {
    ...coupon,
    couponId,
    regionId: coupon.regionId,
    token
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
    const tokenData = makeTokenData({ coupon, couponId })

    const token = Buffer.from(JSON.stringify(tokenData)).toString('base64')

    const itemToSave = makeItemToSave({ coupon, couponId, token })

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
