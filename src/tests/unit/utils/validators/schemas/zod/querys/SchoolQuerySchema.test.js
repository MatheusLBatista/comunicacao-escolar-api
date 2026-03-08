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

});
