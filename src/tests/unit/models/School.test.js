import mongoose from 'mongoose';
import School from '../../../models/School.js';

describe('School Model', () => {
  it('should create a school document correctly', () => {
    const school = new School({
      name: 'Test School',
      tax_id: '123456789',
      address: {
        street: 'Main Street',
        number: '100',
        city: 'Test City',
        state: 'TS',
        zip_code: '12345',
      },
    });

    expect(school.name).toBe('Test School');
    expect(school.tax_id).toBe('123456789');
    expect(school.address.street).toBe('Main Street');
    expect(school.address.number).toBe('100');
  });

  it('should have active default as true', () => {
    const school = new School({
      name: 'Test School',
      tax_id: '123456789',
    });

    expect(school.active).toBe(true);
  });

  it('should require name and tax_id fields', async () => {
    const school = new School({});

    let error;

    try {
      await school.validate();
    } catch (err) {
      error = err;
    }

    expect(error.errors.name).toBeDefined();
    expect(error.errors.tax_id).toBeDefined();
  });

  it('should have timestamps fields', () => {
    const schemaPaths = School.schema.paths;

    expect(schemaPaths.created_at).toBeDefined();
    expect(schemaPaths.updated_at).toBeDefined();
  });

  it('should have mongoosePaginate plugin applied', () => {
    expect(typeof School.paginate).toBe('function');
  });
});
