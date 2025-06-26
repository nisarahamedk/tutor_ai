import { ZodSchema, ZodError } from 'zod';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Array<{ field: string; message: string; }>;
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public details: Array<{ field: string; message: string; }>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validates data against a Zod schema
 */
export function validateData<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validatedData = schema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      return {
        success: false,
        error: 'Validation failed',
        details,
      };
    }
    
    return {
      success: false,
      error: 'Unknown validation error',
    };
  }
}

/**
 * Validates form data and converts to proper types
 */
export function validateFormData<T>(
  schema: ZodSchema<T>,
  formData: FormData
): ValidationResult<T> {
  const data: Record<string, unknown> = {};
  
  // Convert FormData to object
  for (const [key, value] of formData.entries()) {
    if (key.includes('.')) {
      // Handle nested objects (e.g., "userPreferences.pace")
      const keys = key.split('.');
      let current = data;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]] as Record<string, unknown>;
      }
      current[keys[keys.length - 1]] = value;
    } else if (key.includes('[') && key.includes(']')) {
      // Handle arrays (e.g., "skills[0]")
      const match = key.match(/^([^[]+)\[(\d+)\]$/);
      if (match) {
        const [, arrayName, index] = match;
        if (!data[arrayName]) {
          data[arrayName] = [];
        }
        (data[arrayName] as unknown[])[parseInt(index)] = value;
      }
    } else {
      // Handle primitives
      data[key] = value;
    }
  }
  
  return validateData(schema, data);
}

/**
 * Validates API response data
 */
export function validateResponse<T>(
  schema: ZodSchema<T>,
  response: unknown
): T {
  const result = validateData(schema, response);
  
  if (!result.success) {
    throw new ValidationError(
      result.error || 'Response validation failed',
      result.details || []
    );
  }
  
  return result.data!;
}

/**
 * Sanitizes and validates user input
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .slice(0, 2000); // Limit length
}

/**
 * Validates UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates URL format
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a validation error response
 */
export function createValidationError(
  message: string,
  details?: Array<{ field: string; message: string; }>
) {
  return {
    success: false,
    error: message,
    isLoading: false,
    details,
  };
}

/**
 * Handles common validation scenarios
 */
export class CommonValidators {
  static required(value: unknown, fieldName: string): string | null {
    if (value === null || value === undefined || value === '') {
      return `${fieldName} is required`;
    }
    return null;
  }
  
  static minLength(value: string, min: number, fieldName: string): string | null {
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  }
  
  static maxLength(value: string, max: number, fieldName: string): string | null {
    if (value.length > max) {
      return `${fieldName} must be at most ${max} characters`;
    }
    return null;
  }
  
  static range(value: number, min: number, max: number, fieldName: string): string | null {
    if (value < min || value > max) {
      return `${fieldName} must be between ${min} and ${max}`;
    }
    return null;
  }
  
  static email(value: string, fieldName: string): string | null {
    if (!isValidEmail(value)) {
      return `${fieldName} must be a valid email address`;
    }
    return null;
  }
  
  static uuid(value: string, fieldName: string): string | null {
    if (!isValidUUID(value)) {
      return `${fieldName} must be a valid UUID`;
    }
    return null;
  }
}