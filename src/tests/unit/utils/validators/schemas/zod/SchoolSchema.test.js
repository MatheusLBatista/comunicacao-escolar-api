import {
  SchoolSchema,
  SchoolUpdateSchema,
} from '../../../../../../utils/validators/schemas/zod/SchoolSchema.js';

describe('SchoolSchema', () => {
  const validSchool = {
    name: 'Test School',
    tax_id: '12345678901234',
    address: {
      street: 'Main Street',
      number: '100',
      city: 'Test City',
      state: 'TS',
      zip_code: '12345678',
    },
  };

  it('should validate a correct school object', () => {
    const result = SchoolSchema.parse(validSchool);

    expect(result.name).toBe('Test School');
    expect(result.tax_id).toBe('12345678901234');
  });

  it('should apply default active value', () => {
    const result = SchoolSchema.parse(validSchool);

    expect(result.active).toBe(true);
  });

  it('should throw error when name is missing', () => {
    const invalidData = { ...validSchool };
    delete invalidData.name;

    expect(() => SchoolSchema.parse(invalidData)).toThrow();
  });

  it('should throw error when tax_id has invalid length', () => {
    const invalidData = {
      ...validSchool,
      tax_id: '123',
    };

    expect(() => SchoolSchema.parse(invalidData)).toThrow();
  });

  it('should throw error when tax_id contains letters', () => {
    const invalidData = {
      ...validSchool,
      tax_id: '1234567890123A',
    };

    expect(() => SchoolSchema.parse(invalidData)).toThrow();
  });

  it('should throw error when zip_code has invalid length', () => {
    const invalidData = {
      ...validSchool,
      address: {
        ...validSchool.address,
        zip_code: '123',
      },
    };

    expect(() => SchoolSchema.parse(invalidData)).toThrow();
  });

  it('should throw error when required address fields are missing', () => {
    const invalidData = {
      ...validSchool,
      address: {},
    };

    expect(() => SchoolSchema.parse(invalidData)).toThrow();
  });
});
