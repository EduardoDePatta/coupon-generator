import { dynamoDb, Tables } from '../../db'
import { BuildHttpResponse, IAuthUtil, IValidatorUtil, RequestUtil, ValidationRules } from './../../utils'
import { v4 as uuidv4 } from 'uuid'
import { Coupon } from './interfaces'
import { User } from './../auth/interfaces'

interface MakeTokenDataParams {
  coupon: Coupon
  couponId: string
  expiresAt: string
  user: User
}

interface MakeItemToSaveParams {
  coupon: Coupon
  couponId: string
  token: string
  expiresAt: string
  user: User
}

interface PostCouponParams {
  coupon: Coupon
  user: User
}
export interface IPostCouponService {
  execute(params: PostCouponParams): Promise<BuildHttpResponse>
}

class PostCouponService implements IPostCouponService {
  constructor(private readonly validator: IValidatorUtil, private readonly auth: IAuthUtil) {}
  public async execute({ coupon, user }: PostCouponParams) {
    try {
      this.validator.validateFields<Coupon>(coupon, ['restaurantId', 'productCode', 'discountValue'], {
        discountValue: ValidationRules.isPositiveNumber,
        restaurantId: ValidationRules.isNonEmptyString,
        productCode: ValidationRules.isNonEmptyString
      })
      this.validator.validateFields(user, ['userId', 'regionId', 'email', 'active'])

      const couponId = uuidv4()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const tokenData = this.makeTokenData({ coupon, couponId, expiresAt, user })
      const token = this.auth.generateHMACToken(tokenData)

      const itemToSave = this.makeItemToSave({ coupon, couponId, token, expiresAt, user })

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

  private makeItemToSave({ coupon, couponId, token, expiresAt, user }: MakeItemToSaveParams): Coupon {
    return {
      userId: user.userId,
      couponId,
      regionId: user.regionId,
      restaurantId: coupon.restaurantId,
      productCode: coupon.productCode,
      discountValue: coupon.discountValue,
      token,
      expiresAt,
      used: false
    }
  }

  private makeTokenData({ coupon, couponId, expiresAt, user }: MakeTokenDataParams) {
    return {
      userId: user.userId,
      regionId: user.regionId,
      restaurantId: coupon.restaurantId,
      productCode: coupon.productCode,
      discountValue: coupon.discountValue,
      couponId,
      expiresAt
    }
  }
}

export { PostCouponService }
