import { dynamoDb, Tables } from '../../db'
import { BuildHttpResponse, IAuthUtil, IValidatorUtil, RequestUtil, ValidationRules } from './../../utils'
import { v4 as uuidv4 } from 'uuid'
import { Coupon } from './interfaces'

interface MakeTokenDataParams {
  coupon: Coupon
  couponId: string
  expiresAt: string
}

interface MakeItemToSaveParams {
  coupon: Coupon
  couponId: string
  token: string
  expiresAt: string
}

export interface IPostCouponService {
  execute(params: { coupon: Coupon }): Promise<BuildHttpResponse>
}

class PostCouponService implements IPostCouponService {
  constructor(private readonly validator: IValidatorUtil, private readonly auth: IAuthUtil) {}
  public async execute({ coupon }: { coupon: Coupon }) {
    try {
      this.validator.validateFields<Coupon>(coupon, ['userId', 'regionId', 'restaurantId', 'productCode', 'discountValue'], {
        discountValue: ValidationRules.isPositiveNumber,
        userId: ValidationRules.isNonEmptyString,
        regionId: ValidationRules.isNonEmptyString,
        restaurantId: ValidationRules.isNonEmptyString,
        productCode: ValidationRules.isNonEmptyString
      })

      const couponId = uuidv4()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const tokenData = this.makeTokenData({ coupon, couponId, expiresAt })
      const token = this.auth.generateHMACToken(tokenData)

      const itemToSave = this.makeItemToSave({ coupon, couponId, token, expiresAt })

      await dynamoDb.put({ TableName: Tables.COUPONS, Item: itemToSave }).promise()

      return RequestUtil.buildResponse({
        statusCode: 200,
        data: itemToSave,
        message: 'Cupom criado com sucesso.'
      })
    } catch (error) {
      return RequestUtil.buildResponse({
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido',
        data: {}
      })
    }
  }

  private makeItemToSave({ coupon, couponId, token, expiresAt }: MakeItemToSaveParams): Coupon {
    return {
      userId: coupon.userId,
      couponId,
      regionId: coupon.regionId,
      restaurantId: coupon.restaurantId,
      productCode: coupon.productCode,
      discountValue: coupon.discountValue,
      token,
      expiresAt,
      used: false
    }
  }

  private makeTokenData({ coupon, couponId, expiresAt }: MakeTokenDataParams) {
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
}

export { PostCouponService }
