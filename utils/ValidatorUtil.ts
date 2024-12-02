const ValidationRules = {
  isPositiveNumber: (value: any): string | null => (typeof value !== 'number' || value <= 0 ? 'must be a positive number' : null),
  isNonEmptyString: (value: any): string | null => (typeof value !== 'string' || value.trim() === '' ? 'must be a non-empty string' : null)
}

class ValidatorUtil {
  static validateFields<T>(object: Partial<T>, requiredFields: (keyof T)[], customValidators: Record<string, (value: any) => string | null> = {}): void {
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

export { ValidatorUtil, ValidationRules }
