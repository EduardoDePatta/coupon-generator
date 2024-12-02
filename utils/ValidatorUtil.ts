const ValidationRules = {
  isPositiveNumber: (value: any): string | null => (typeof value !== 'number' || value <= 0 ? 'must be a positive number' : null),
  isNonEmptyString: (value: any): string | null => (typeof value !== 'string' || value.trim() === '' ? 'must be a non-empty string' : null),
  isEmail: (value: any): string | null => {
    if (typeof value !== 'string') {
      return 'must be a string'
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? null : 'must be a valid email address'
  }
}

interface IValidatorUtil {
  validateFields<T>(object: Partial<T>, requiredFields: (keyof T)[], customValidators?: Record<string, (value: any) => string | null>): void
}

class ValidatorUtil implements IValidatorUtil {
  validateFields<T>(object: Partial<T>, requiredFields: (keyof T)[], customValidators: Record<string, (value: any) => string | null> = {}): void {
    const missingFields = requiredFields.filter((field) => !object[field])
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
    }

    Object.entries(customValidators).forEach(([field, validator]) => {
      if (object[field as keyof T] !== undefined) {
        const errorMessage = validator(object[field as keyof T])
        if (errorMessage) {
          throw new Error(`Validation error on field "${field}": ${errorMessage}`)
        }
      }
    })
  }
}

export { ValidatorUtil, ValidationRules, IValidatorUtil }
