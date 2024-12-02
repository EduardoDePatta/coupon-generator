interface Coupon {
  userId: string
  regionId: string
  restaurantId: string
  productCode: string
  discountValue: number
  couponId: string
  token?: string
  expiresAt?: string
  used?: boolean
}

export { Coupon }
