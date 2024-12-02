import { dynamoDb, Tables } from '../../db'
import { BuildHttpResponse, IAuthUtil, IValidatorUtil, RequestUtil, ValidationRules } from '../../utils'
import * as QRCode from 'qrcode'
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
    console.log('🚀 ~ GetCouponService ~ execute ~ couponId:', couponId)
    console.log('🚀 ~ GetCouponService ~ execute ~ userId:', userId)
    try {
      this.validator.validateFields<GetCouponParams>({ userId, couponId }, ['userId', 'couponId'], {
        userId: ValidationRules.isNonEmptyString,
        couponId: ValidationRules.isNonEmptyString
      })
      console.log('passou aqui')

      const response = await dynamoDb
        .get({
          TableName: Tables.COUPONS,
          Key: {
            userId,
            couponId
          }
        })
        .promise()
      console.log('🚀 ~ GetCouponService ~ execute ~ response:', response)

      if (!response.Item) {
        return RequestUtil.buildResponse({
          statusCode: 404,
          message: 'Cupom não encontrado',
          data: null
        })
      }

      const coupon = response.Item
      console.log('🚀 ~ GetCouponService ~ execute ~ coupon:', coupon)

      const tokenValidation = this.auth.validateHMACToken(coupon.token)
      if (!tokenValidation.valid) {
        return RequestUtil.buildResponse({
          statusCode: 400,
          message: tokenValidation.error || 'Token do cupom inválido',
          data: null
        })
      }

      const tokenData = tokenValidation.data as Coupon
      console.log('🚀 ~ GetCouponService ~ execute ~ tokenData:', tokenData)

      if (!tokenData.expiresAt) {
        console.log('entrou aqui')
        throw new Error('O token não contém data de expiração')
      }

      if (new Date(tokenData.expiresAt) < new Date()) {
        console.log('entrou 2')
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
      console.log('🚀 ~ GetCouponService ~ execute ~ redeemUrl:', redeemUrl)
      console.log('length', redeemUrl.length)
      const qrCodeData = QRCode.toDataURL(redeemUrl, (err, data) => {
        if (err) {
          console.log(err, 'aaaaaaaaaaa')
        }
      })
      console.log('🚀 ~ GetCouponService ~ execute ~ qrCodeData:', qrCodeData)

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
      console.log('🚀 ~ GetCouponService ~ execute ~ error:', error)
      return RequestUtil.buildResponse({
        statusCode: 400,
        message: error instanceof Error ? error.message : 'Ocorreu um erro interno no servidor',
        data: { error: error instanceof Error ? error.message : 'Erro desconhecido' }
      })
    }
  }
}

export { GetCouponService }
