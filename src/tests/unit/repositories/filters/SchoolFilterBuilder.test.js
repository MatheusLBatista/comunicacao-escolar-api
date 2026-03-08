import SchoolFilterBuilder from '../../../../repositories/filters/SchoolFilterBuilder.js';

describe('SchoolFilterBuilder', () => {
  let builder;

  beforeEach(() => {
    builder = new SchoolFilterBuilder();
  });

  it('should build an empty filter object by default', () => {
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('should add a name filter', () => {
    builder.withName('Test School');
    const filters = builder.build();
    expect(filters).toEqual({ name: { $regex: 'Test School', $options: 'i' } });
  });

  it('should not add a name filter if name is undefined', () => {
    builder.withName(undefined);
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('should add a tax_id filter', () => {
    builder.withTaxId('123456789');
    const filters = builder.build();
    expect(filters).toEqual({ tax_id: { $regex: '123456789', $options: 'i' } });
  });

  it('should not add a tax_id filter if tax_id is undefined', () => {
    builder.withTaxId(undefined);
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('should add an active filter', () => {
    builder.withActive('true');
    const filters = builder.build();
    expect(filters).toEqual({ active: true });
  });

  it('should add an active filter with false value', () => {
    builder.withActive('false');
    const filters = builder.build();
    expect(filters).toEqual({ active: false });
  });

  it('should not add an active filter if active is undefined', () => {
    builder.withActive(undefined);
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('should not add an active filter if active is an invalid value', () => {
    builder.withActive('invalid');
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('should add a city filter', () => {
    builder.withCity('Test City');
    const filters = builder.build();
    expect(filters).toEqual({
      'address.city': { $regex: 'Test City', $options: 'i' },
    });
  });

  it('should not add a city filter if city is undefined', () => {
    builder.withCity(undefined);
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('should add a state filter', () => {
    builder.withState('TS');
    const filters = builder.build();
    expect(filters).toEqual({
      'address.state': { $regex: 'TS', $options: 'i' },
    });
  });

  it('should not add a state filter if state is undefined', () => {
    builder.withState(undefined);
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('should add a zip_code filter', () => {
    builder.withZipCode('12345');
    const filters = builder.build();
    expect(filters).toEqual({
      'address.zip_code': { $regex: '12345', $options: 'i' },
    });
  });

  it('should not add a zip_code filter if zip_code is undefined', () => {
    builder.withZipCode(undefined);
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('should add an address filter', () => {
    builder.withAddress('Main Street');
    const filters = builder.build();
    expect(filters).toEqual({
      $or: [
        { 'address.street': { $regex: 'Main Street', $options: 'i' } },
        { 'address.number': { $regex: 'Main Street', $options: 'i' } },
        { 'address.city': { $regex: 'Main Street', $options: 'i' } },
        { 'address.state': { $regex: 'Main Street', $options: 'i' } },
        { 'address.zip_code': { $regex: 'Main Street', $options: 'i' } },
      ],
    });
  });

  it('should not add an address filter if address is undefined', () => {
    builder.withAddress(undefined);
    const filters = builder.build();
    expect(filters).toEqual({});
  });

  it('should combine multiple filters', () => {
    builder.withName('Test School').withCity('Test City').withActive('true');
    const filters = builder.build();
    expect(filters).toEqual({
      name: { $regex: 'Test School', $options: 'i' },
      'address.city': { $regex: 'Test City', $options: 'i' },
      active: true,
    });
  });
});
