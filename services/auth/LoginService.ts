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
        .get({
          TableName: Tables.USERS,
          Key: { email }
        })
        .promise()

      if (!response.Item) {
        return RequestUtil.buildResponse({
          statusCode: 404,
          message: 'Usuário não encontrado',
          data: null
        })
      }

      const user = response.Item

      const isPasswordValid = await this.auth.comparePassword(password, user.password)
      if (!isPasswordValid) {
        return RequestUtil.buildResponse({
          statusCode: 401,
          message: 'Credenciais inválidas',
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
        message: 'Login realizado com sucesso',
        data: { token }
      })
    } catch (error) {
      return RequestUtil.buildResponse({
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Erro interno no servidor',
        data: null
      })
    }
  }
}

export { LoginService, ILoginService }
