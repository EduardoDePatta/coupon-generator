import { BuildResponse } from '../models'

export const buildResponse = ({ body, statusCode }: BuildResponse) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  }
}
