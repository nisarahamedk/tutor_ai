import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  validateData,
  validateFormData,
  validateResponse,
  ValidationError,
  sanitizeInput,
  isValidUUID,
  isValidEmail,
  isValidURL,
  CommonValidators,
} from '../validators';

describe('validators', () => {
  const testSchema = z.object({
    name: z.string().min(1),
    age: z.number().min(0),
    email: z.string().email(),
  });

  describe('validateData', () => {
    it('should validate valid data successfully', () => {
      const data = { name: 'John', age: 25, email: 'john@example.com' };
      const result = validateData(testSchema, data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.error).toBeUndefined();
    });

    it('should return validation errors for invalid data', () => {
      const data = { name: '', age: -1, email: 'invalid-email' };
      const result = validateData(testSchema, data);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
      expect(result.details).toHaveLength(3);
    });
  });

  describe('validateFormData', () => {
    it('should validate form data successfully', () => {
      const transformedSchema = z.object({
        name: z.string().min(1),
        age: z.string().transform(val => parseInt(val)).pipe(z.number().min(0)),
        email: z.string().email(),
      });
      
      const formData = new FormData();
      formData.append('name', 'John');
      formData.append('age', '25');
      formData.append('email', 'john@example.com');

      const result = validateFormData(transformedSchema, formData);

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('John');
      expect(result.data?.age).toBe(25); // Transformed to number
    });

    it('should handle nested objects', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          preferences: z.object({
            theme: z.string(),
          }),
        }),
      });

      const formData = new FormData();
      formData.append('user.name', 'John');
      formData.append('user.preferences.theme', 'dark');

      const result = validateFormData(schema, formData);

      expect(result.success).toBe(true);
      expect(result.data?.user.name).toBe('John');
      expect(result.data?.user.preferences.theme).toBe('dark');
    });

    it('should handle arrays', () => {
      const schema = z.object({
        skills: z.array(z.string()),
      });

      const formData = new FormData();
      formData.append('skills[0]', 'JavaScript');
      formData.append('skills[1]', 'TypeScript');

      const result = validateFormData(schema, formData);

      expect(result.success).toBe(true);
      expect(result.data?.skills).toEqual(['JavaScript', 'TypeScript']);
    });
  });

  describe('validateResponse', () => {
    it('should validate response successfully', () => {
      const data = { name: 'John', age: 25, email: 'john@example.com' };
      const result = validateResponse(testSchema, data);

      expect(result).toEqual(data);
    });

    it('should throw ValidationError for invalid response', () => {
      const data = { name: '', age: -1, email: 'invalid' };

      expect(() => validateResponse(testSchema, data)).toThrow(ValidationError);
    });
  });

  describe('sanitizeInput', () => {
    it('should trim and normalize spaces', () => {
      const input = '  hello   world  ';
      const result = sanitizeInput(input);

      expect(result).toBe('hello world');
    });

    it('should limit length to 2000 characters', () => {
      const input = 'a'.repeat(3000);
      const result = sanitizeInput(input);

      expect(result.length).toBe(2000);
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUIDs', () => {
      const validUUID = '123e4567-e89b-12d3-a456-426614174000';
      expect(isValidUUID(validUUID)).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUUID('invalid-uuid')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID('123')).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });
  });

  describe('isValidURL', () => {
    it('should validate correct URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://localhost:3000')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidURL('invalid-url')).toBe(false);
      expect(isValidURL('')).toBe(false);
    });
  });

  describe('CommonValidators', () => {
    describe('required', () => {
      it('should pass for valid values', () => {
        expect(CommonValidators.required('test', 'field')).toBeNull();
        expect(CommonValidators.required(0, 'field')).toBeNull();
      });

      it('should fail for empty values', () => {
        expect(CommonValidators.required('', 'field')).toBe('field is required');
        expect(CommonValidators.required(null, 'field')).toBe('field is required');
        expect(CommonValidators.required(undefined, 'field')).toBe('field is required');
      });
    });

    describe('minLength', () => {
      it('should pass for valid length', () => {
        expect(CommonValidators.minLength('hello', 3, 'field')).toBeNull();
      });

      it('should fail for short strings', () => {
        expect(CommonValidators.minLength('hi', 3, 'field')).toBe('field must be at least 3 characters');
      });
    });

    describe('range', () => {
      it('should pass for values in range', () => {
        expect(CommonValidators.range(5, 1, 10, 'field')).toBeNull();
      });

      it('should fail for values out of range', () => {
        expect(CommonValidators.range(0, 1, 10, 'field')).toBe('field must be between 1 and 10');
        expect(CommonValidators.range(11, 1, 10, 'field')).toBe('field must be between 1 and 10');
      });
    });
  });
});