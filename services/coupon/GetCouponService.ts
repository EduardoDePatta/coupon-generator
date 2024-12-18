import { dynamoDb, Tables } from '../../db'
import { BuildHttpResponse, IAuthUtil, IValidatorUtil, RequestUtil, ValidationRules } from '../../utils'
import { toDataURL } from 'qrcode'
import { Coupon } from './interfaces'

interface GetCouponParams {
  userId?: string
  couponId?: string
}

export interface IGetCouponService {
  execute(params: GetCouponParams): Promise<BuildHttpResponse>
}

class GetCouponService implements IGetCouponService {
  constructor(private readonly validator: IValidatorUtil, private readonly auth: IAuthUtil) {}

  public async execute({ userId, couponId }: GetCouponParams) {
    try {
      this.validator.validateFields<GetCouponParams>({ userId, couponId }, ['userId', 'couponId'], {
        userId: ValidationRules.isNonEmptyString,
        couponId: ValidationRules.isNonEmptyString
      })

      const response = await dynamoDb
        .get({
          TableName: Tables.COUPONS,
          Key: {
            userId,
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

      const tokenValidation = this.auth.validateHMACToken(coupon.token)
      if (!tokenValidation.valid) {
        return RequestUtil.buildResponse({
          statusCode: 400,
          message: tokenValidation.error || 'Invalid coupon token',
          data: null
        })
      }

      const tokenData = tokenValidation.data as Coupon

      if (!tokenData.expiresAt) {
        throw new Error('O token não contém data de expiração')
      }

      if (new Date(tokenData.expiresAt) < new Date()) {
        return RequestUtil.buildResponse({
          statusCode: 400,
          message: 'Expired coupon',
          data: null
        })
      }

      if (coupon.used) {
        return RequestUtil.buildResponse({
          statusCode: 400,
          message: 'Coupon already used',
          data: null
        })
      }

      const redeemUrl = `${process.env.SERVERLESS_URL}/redeem?userId=${coupon.userId}&regionId=${coupon.regionId}&couponId=${couponId}`
      const qrCodeData = await toDataURL(redeemUrl)

      return RequestUtil.buildResponse({
        statusCode: 200,
        message: 'Succesfully recovered coupon',
        data: {
          ...coupon,
          qrCode: qrCodeData,
          redeemUrl
        }
      })
    } catch (error) {
      return RequestUtil.buildResponse({
        statusCode: 400,
        message: error instanceof Error ? error.message : 'Internal Server Error',
        data: { error: error instanceof Error ? error.message : 'Unknown Error' }
      })
    }
  }
}

export { GetCouponService }
