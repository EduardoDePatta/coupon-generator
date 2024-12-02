import { dynamoDb, Tables } from '../../db'
import { AuthUtil, RequestUtil, ValidationRules, ValidatorUtil } from '../../utils'
import * as QRCode from 'qrcode'
import { Coupon } from './postCoupon'

export interface GetCouponParams {
  couponId?: string
  regionId?: string
}

export const getCoupon = async ({ regionId, couponId }: GetCouponParams) => {
  try {
    ValidatorUtil.validateFields<GetCouponParams>({ regionId, couponId }, ['regionId', 'couponId'], {
      regionId: ValidationRules.isNonEmptyString,
      couponId: ValidationRules.isNonEmptyString
    })

    const response = await dynamoDb
      .get({
        TableName: Tables.COUPONS,
        Key: {
          regionId,
          couponId
        }
      })
      .promise()

    if (!response.Item) {
      return RequestUtil.buildResponse({
        statusCode: 404,
        message: 'Coupon not found',
        data: null
      })
    }

    const coupon = response.Item

    console.log('Retrieved Token:', coupon.token)
    console.log('HMAC_SECRET (Validation):', process.env.HMAC_SECRET)
    const tokenValidation = AuthUtil.validateHMACToken(coupon.token)
    console.log('🚀 ~ getCoupon ~ tokenValidation:', tokenValidation)
    if (!tokenValidation.valid) {
      return RequestUtil.buildResponse({
        statusCode: 400,
        message: tokenValidation.error || 'Invalid coupon token',
        data: null
      })
    }

    const tokenData = tokenValidation.data as Coupon

    if (!tokenData.expiresAt) {
      throw new Error('Token does not contain expiration date')
    }

    if (new Date(tokenData.expiresAt) < new Date()) {
      return RequestUtil.buildResponse({
        statusCode: 400,
        message: 'Coupon has expired',
        data: null
      })
    }

    if (coupon.used) {
      return RequestUtil.buildResponse({
        statusCode: 400,
        message: 'Coupon has already been used',
        data: null
      })
    }

    const qrCodeData = await QRCode.toDataURL(coupon.token)

    return RequestUtil.buildResponse({
      statusCode: 200,
      message: 'Coupon retrieved successfully',
      data: {
        ...coupon,
        qrCode: qrCodeData
      }
    })
  } catch (error) {
    return RequestUtil.buildResponse({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Internal server error occurred',
      data: { error: error instanceof Error ? error.message : 'Unknown error' }
    })
  }
}
