import { dynamoDb, Tables } from '../../db'
import { AuthUtil, RequestUtil, ValidationRules, ValidatorUtil } from '../../utils'
import * as QRCode from 'qrcode'
import { Coupon } from './postCoupon'

export interface GetCouponParams {
  couponId?: string
  regionId?: string
}

export const getCoupon = async ({ regionId, couponId }: GetCouponParams) => {
  console.log('🚀 ~ getCoupon ~ couponId:', couponId)
  console.log('🚀 ~ getCoupon ~ regionId:', regionId)
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

    const tokenValidation = AuthUtil.validateHMACToken(coupon.token)
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
    console.log('chegou aqui')

    // rm essa url daqui
    const redeemUrl = `https://l3fvh570eh.execute-api.eu-north-1.amazonaws.com/production/redeem?token=${encodeURIComponent(coupon.token)}`
    const qrCodeData = await QRCode.toDataURL(redeemUrl)
    console.log('🚀 ~ getCoupon ~ redeemUrl:', redeemUrl)

    return RequestUtil.buildResponse({
      statusCode: 200,
      message: 'Coupon retrieved successfully',
      data: {
        ...coupon,
        qrCode: qrCodeData,
        redeemUrl
      }
    })
  } catch (error) {
    console.log('🚀 ~ getCoupon ~ error:', error)
    return RequestUtil.buildResponse({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Internal server error occurred',
      data: { error: error instanceof Error ? error.message : 'Unknown error' }
    })
  }
}
