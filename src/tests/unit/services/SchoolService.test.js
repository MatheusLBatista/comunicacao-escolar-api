import SchoolService from '../../../services/SchoolService.js';
import SchoolRepository from '../../../repositories/SchoolRepository.js';
import {
  CustomError,
  HttpStatusCodes,
  messages,
} from '../../../utils/helpers/index.js';

jest.mock('../../../repositories/SchoolRepository.js');

describe('SchoolService', () => {
  let service;
  let mockRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new SchoolService();

    mockRepository = {
      create: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByName: jest.fn(),
      findByTaxId: jest.fn(),
      findById: jest.fn(),
    };

    service.repository = mockRepository;
  });

  describe('create', () => {
    it('should create a school successfully', async () => {
      const schoolData = { name: 'Test School', tax_id: '123' };

      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.findByTaxId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(schoolData);

      const result = await service.create(schoolData);

      expect(mockRepository.findByName).toHaveBeenCalledWith(
        'Test School',
        null,
      );
      expect(mockRepository.findByTaxId).toHaveBeenCalledWith('123');
      expect(mockRepository.create).toHaveBeenCalledWith(schoolData);
      expect(result).toEqual(schoolData);
    });
  });

  describe('list', () => {
    it('should list schools successfully', async () => {
      const schools = [{ name: 'School 1' }];

      mockRepository.list.mockResolvedValue(schools);

      const result = await service.list({});

      expect(mockRepository.list).toHaveBeenCalled();
      expect(result).toEqual(schools);
    });
  });

  describe('update', () => {
    it('should update a school successfully', async () => {
      const id = '1';
      const parsedData = { name: 'Updated School' };
      const updatedSchool = { id, ...parsedData };

      mockRepository.findById.mockResolvedValue({ id });
      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue(updatedSchool);

      const result = await service.update(id, parsedData);

      expect(mockRepository.findById).toHaveBeenCalledWith(id);
      expect(mockRepository.findByName).toHaveBeenCalledWith(
        'Updated School',
        id,
      );
      expect(mockRepository.update).toHaveBeenCalledWith(id, parsedData);
      expect(result).toEqual(updatedSchool);
    });

    it('should update school without validating name when name is not provided', async () => {
      const id = '1';
      const parsedData = { active: true };
      const updatedSchool = { id, ...parsedData };

      mockRepository.findById.mockResolvedValue({ id });
      mockRepository.update.mockResolvedValue(updatedSchool);

      const validateNameSpy = jest.spyOn(service, 'validateName');

      const result = await service.update(id, parsedData);

      expect(validateNameSpy).not.toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalledWith(id, parsedData);
      expect(result).toEqual(updatedSchool);
    });
  });

  describe('delete', () => {
    it('should delete a school successfully', async () => {
      const id = '1';
      const deletedSchool = { id, name: 'Deleted School' };

      mockRepository.findById.mockResolvedValue({ id });
      mockRepository.delete.mockResolvedValue(deletedSchool);

      const result = await service.delete(id);

      expect(mockRepository.findById).toHaveBeenCalledWith(id);
      expect(mockRepository.delete).toHaveBeenCalledWith(id);
      expect(result).toEqual(deletedSchool);
    });
  });

  describe('validateName', () => {
    it('should throw error if name already exists', async () => {
      mockRepository.findByName.mockResolvedValue({ name: 'Existing School' });

      await expect(service.validateName('Existing School')).rejects.toThrow(
        CustomError,
      );
    });
  });

  describe('validateTaxId', () => {
    it('should throw error if tax_id already exists', async () => {
      mockRepository.findByTaxId.mockResolvedValue({ tax_id: '123' });

      await expect(service.validateTaxId('123')).rejects.toThrow(CustomError);
    });
  });

  describe('ensureSchoolExists', () => {
    it('should return school if exists', async () => {
      const school = { id: '1', name: 'Test School' };

      mockRepository.findById.mockResolvedValue(school);

      const result = await service.ensureSchoolExists('1');

      expect(mockRepository.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(school);
    });

    it('should throw error if school does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.ensureSchoolExists('1')).rejects.toThrow(
        CustomError,
      );
    });
  });
});
