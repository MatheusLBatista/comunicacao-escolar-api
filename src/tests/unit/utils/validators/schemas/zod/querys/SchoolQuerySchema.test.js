import mongoose from 'mongoose';
import {
  SchoolIdSchema,
  SchoolQuerySchema,
} from '../../../../../../../utils/validators/schemas/zod/querys/SchoolQuerySchema.js';

describe('SchoolIdSchema', () => {
  it('should validate a valid ObjectId', () => {
    const validId = new mongoose.Types.ObjectId().toString();

    const result = SchoolIdSchema.parse(validId);

    expect(result).toBe(validId);
  });

  it('should throw error for invalid ObjectId', () => {
    const invalidId = '123';

    expect(() => SchoolIdSchema.parse(invalidId)).toThrow('ID inválido');
  });
});

describe('SchoolQuerySchema', () => {
  it('should accept an empty query object', () => {
    const result = SchoolQuerySchema.parse({});

    expect(result).toEqual({});
  });

  it('should validate a query with valid fields', () => {
    const query = {
      name: 'Test School',
      tax_id: '12345678901234',
      active: 'true',
      city: 'Test City',
      state: 'TS',
      zip_code: '12345',
      address: 'Main Street',
      page: '1',
      limit: '10',
    };

    const result = SchoolQuerySchema.parse(query);

    expect(result).toEqual({
      name: 'Test School',
      tax_id: '12345678901234',
      active: true,
      city: 'Test City',
      state: 'TS',
      zip_code: '12345',
      address: 'Main Street',
      page: 1,
      limit: 10,
    });
  });

  it('should throw an error for invalid page and limit', () => {
    const query = {
      page: '-1',
      limit: '200',
    };

    expect(() => SchoolQuerySchema.parse(query)).toThrow(
      'O limite máximo permitido é 100',
    );
  });

  it('should throw an error for invalid active value', () => {
    const query = {
      active: 'invalid',
    };

    expect(() => SchoolQuerySchema.parse(query)).toThrow();
  });

  it('should throw an error for invalid tax_id length', () => {
    const query = {
      tax_id: '12',
    };

    expect(() => SchoolQuerySchema.parse(query)).toThrow(
      'O CNPJ deve conter pelo menos 3 caracteres',
    );
  });

  it('should throw an error for invalid state length', () => {
    const query = {
      state: 'T',
    };

    expect(() => SchoolQuerySchema.parse(query)).toThrow(
      'O estado deve conter pelo menos 2 caracteres',
    );
  });

  it('should throw an error for invalid zip_code length', () => {
    const query = {
      zip_code: '12',
    };

    expect(() => SchoolQuerySchema.parse(query)).toThrow(
      'O CEP deve conter pelo menos 3 caracteres',
    );
  });

  it('should throw an error for invalid name length', () => {
    const query = {
      name: '',
    };

    expect(() => SchoolQuerySchema.parse(query)).toThrow(
      'O nome deve conter pelo menos 1 caractere',
    );
  });

  it('should throw an error for invalid city length', () => {
    const query = {
      city: '',
    };

    expect(() => SchoolQuerySchema.parse(query)).toThrow(
      'A cidade deve conter pelo menos 1 caractere',
    );
  });

  it('should throw an error for invalid address length', () => {
    const query = {
      address: '',
    };

    expect(() => SchoolQuerySchema.parse(query)).toThrow(
      'O endereço deve conter pelo menos 1 caractere',
    );
  });
});
