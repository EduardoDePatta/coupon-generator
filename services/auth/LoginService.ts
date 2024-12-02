import { dynamoDb, Tables } from '../../db'
import { BuildHttpResponse, IAuthUtil, IValidatorUtil, RequestUtil, ValidationRules } from '../../utils'

interface LoginParams {
  email: string
  password: string
}

interface ILoginService {
  execute(params: LoginParams): Promise<BuildHttpResponse>
}

class LoginService implements ILoginService {
  constructor(private readonly validator: IValidatorUtil, private readonly auth: IAuthUtil) {}

  public async execute({ email, password }: LoginParams): Promise<BuildHttpResponse> {
    try {
      this.validator.validateFields<LoginParams>({ email, password }, ['email', 'password'], {
        email: ValidationRules.isEmail,
        password: ValidationRules.isNonEmptyString
      })

      const response = await dynamoDb
        .query({
          TableName: Tables.USERS,
          IndexName: 'email-index',
          KeyConditionExpression: 'email = :email',
          ExpressionAttributeValues: {
            ':email': email
          }
        })
        .promise()

      if (!response.Items || response.Items.length === 0) {
        return RequestUtil.buildResponse({
          statusCode: 404,
          message: 'User not found',
          data: null
        })
      }

      if (response.Items.length > 1) {
        return RequestUtil.buildResponse({
          statusCode: 404,
          message: 'Duplicated register',
          data: null
        })
      }

      const user = response.Items[0]

      const isPasswordValid = await this.auth.comparePassword(password, user.password)
      if (!isPasswordValid) {
        return RequestUtil.buildResponse({
          statusCode: 401,
          message: 'Invalid Credentials',
          data: null
        })
      }

      const token = this.auth.generateJWT({
        userId: user.userId,
        email: user.email,
        role: user.role
      })

      return RequestUtil.buildResponse({
        statusCode: 200,
        message: 'Successfully logged in',
        data: { token }
      })
    } catch (error) {
      return RequestUtil.buildResponse({
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Internal Server Error',
        data: null
      })
    }
  }
}

export { LoginService, ILoginService }
