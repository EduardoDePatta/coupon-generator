import { IValidatorUtil, IAuthUtil, ValidatorUtil, AuthUtil } from './../../utils'
import { GetCouponService, IGetCouponService, IPostCouponService, IRedeemCouponService, PostCouponService, RedeemCouponService } from './../coupon'

class ServiceFactory {
  private validator: IValidatorUtil
  private auth: IAuthUtil

  constructor() {
    this.validator = new ValidatorUtil()
    this.auth = new AuthUtil()
  }

  public getCouponService(): IGetCouponService {
    return new GetCouponService(this.validator, this.auth)
  }

  public postCouponService(): IPostCouponService {
    return new PostCouponService(this.validator, this.auth)
  }

  public redeemCouponService(): IRedeemCouponService {
    return new RedeemCouponService(this.validator, this.auth)
  }
}

export const serviceFactory = new ServiceFactory()
