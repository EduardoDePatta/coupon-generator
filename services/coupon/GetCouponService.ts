import { dynamoDb, Tables } from '../../db'
import { BuildHttpResponse, IAuthUtil, IValidatorUtil, RequestUtil, ValidationRules } from '../../utils'
import * as QRCode from 'qrcode'
import { Coupon } from './interfaces'

interface GetCouponParams {
  couponId?: string
  regionId?: string
}

export interface IGetCouponService {
  execute(params: GetCouponParams): Promise<BuildHttpResponse>
}

class GetCouponService implements IGetCouponService {
  constructor(private readonly validator: IValidatorUtil, private readonly auth: IAuthUtil) {}

  public async execute({ regionId, couponId }: GetCouponParams) {
    try {
      this.validator.validateFields<GetCouponParams>({ regionId, couponId }, ['regionId', 'couponId'], {
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
          message: 'Cupom não encontrado',
          data: null
        })
      }

      const coupon = response.Item

      const tokenValidation = this.auth.validateHMACToken(coupon.token)
      if (!tokenValidation.valid) {
        return RequestUtil.buildResponse({
          statusCode: 400,
          message: tokenValidation.error || 'Token do cupom inválido',
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
          message: 'O cupom expirou',
          data: null
        })
      }

      if (coupon.used) {
        return RequestUtil.buildResponse({
          statusCode: 400,
          message: 'O cupom já foi utilizado',
          data: null
        })
      }

      const redeemUrl = `${process.env.SERVERLESS_URL}/redeem?token=${encodeURIComponent(coupon.token)}`
      const qrCodeData = await QRCode.toDataURL(redeemUrl)

      return RequestUtil.buildResponse({
        statusCode: 200,
        message: 'Cupom recuperado com sucesso',
        data: {
          ...coupon,
          qrCode: qrCodeData,
          redeemUrl
        }
      })
    } catch (error) {
      return RequestUtil.buildResponse({
        statusCode: 400,
        message: error instanceof Error ? error.message : 'Ocorreu um erro interno no servidor',
        data: { error: error instanceof Error ? error.message : 'Erro desconhecido' }
      })
    }
  }
}

export { GetCouponService }
