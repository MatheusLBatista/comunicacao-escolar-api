import SchoolRepository from '../../../repositories/SchoolRepository.js';
import { CustomError } from '../../../utils/helpers/index.js';
import mongoose from 'mongoose';

describe('SchoolRepository', () => {
  let repository;
  let mockModel;

  beforeEach(() => {
    jest.clearAllMocks();

    mockModel = {
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      findOne: jest.fn(),
      paginate: jest.fn(),
    };

    repository = new SchoolRepository(mockModel);
  });

  describe('create', () => {
    it('should create a school successfully', async () => {
      const schoolData = { name: 'Test School' };

      const saveMock = jest.fn().mockResolvedValue(schoolData);

      const ModelConstructor = jest.fn().mockImplementation(() => ({
        save: saveMock,
      }));

      repository = new SchoolRepository(ModelConstructor);

      const result = await repository.create(schoolData);

      expect(ModelConstructor).toHaveBeenCalledWith(schoolData);
      expect(saveMock).toHaveBeenCalled();
      expect(result).toEqual(schoolData);
    });
  });

  describe('list', () => {
    it('should list all schools', async () => {
      const docData = { name: 'School 1' };
      const mockDoc = { toObject: jest.fn().mockReturnValue(docData) };
      const paginateResult = {
        docs: [mockDoc],
        totalDocs: 1,
        page: 1,
        limit: 10,
      };

      mockModel.paginate.mockResolvedValue(paginateResult);

      const result = await repository.list({ params: {}, query: {} });

      expect(mockModel.paginate).toHaveBeenCalled();
      expect(result.docs).toEqual([docData]);
    });

    it('should handle missing query parameters gracefully', async () => {
      const docData = { name: 'School 1' };
      const mockDoc = { name: 'School 1' };
      const paginateResult = {
        docs: [mockDoc],
        totalDocs: 1,
        page: 1,
        limit: 10,
      };

      mockModel.paginate.mockResolvedValue(paginateResult);

      const result = await repository.list({ params: {} });

      expect(mockModel.paginate).toHaveBeenCalled();
      expect(result.docs).toEqual([docData]);
    });

    it('should return a school by id', async () => {
      const school = {
        toObject: jest.fn().mockReturnValue({ name: 'School 1' }),
      };

      mockModel.findById.mockResolvedValue(school);

      const result = await repository.list({ params: { id: '1' } });

      expect(mockModel.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual({ name: 'School 1' });
    });

    it('should throw error if school not found by id', async () => {
      mockModel.findById.mockResolvedValue(null);

      await expect(repository.list({ params: { id: '1' } })).rejects.toThrow(
        CustomError,
      );
    });
  });

  describe('update', () => {
    it('should update school successfully', async () => {
      const updatedSchool = { id: '1', name: 'Updated School' };

      mockModel.findByIdAndUpdate.mockResolvedValue(updatedSchool);

      const result = await repository.update('1', { name: 'Updated School' });

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '1',
        { name: 'Updated School' },
        { new: true },
      );

      expect(result).toEqual(updatedSchool);
    });

    it('should throw error if school not found during update', async () => {
      mockModel.findByIdAndUpdate.mockResolvedValue(null);

      await expect(
        repository.update('1', { name: 'Updated School' }),
      ).rejects.toThrow(CustomError);
    });
  });

  describe('delete', () => {
    it('should delete a school successfully', async () => {
      const deletedSchool = { id: '1', name: 'Deleted School' };

      mockModel.findByIdAndDelete.mockResolvedValue(deletedSchool);

      const result = await repository.delete('1');

      expect(mockModel.findByIdAndDelete).toHaveBeenCalledWith('1');
      expect(result).toEqual(deletedSchool);
    });

    it('should throw error if school not found during delete', async () => {
      mockModel.findByIdAndDelete.mockResolvedValue(null);

      await expect(repository.delete('1')).rejects.toThrow(CustomError);
    });
  });

  describe('findByName', () => {
    it('should find school by name', async () => {
      const school = { name: 'Test School' };

      mockModel.findOne.mockResolvedValue(school);

      const result = await repository.findByName('Test School');

      expect(mockModel.findOne).toHaveBeenCalledWith({ name: 'Test School' });
      expect(result).toEqual(school);
    });

    it('should ignore id when provided', async () => {
      mockModel.findOne.mockResolvedValue(null);

      await repository.findByName('Test School', '1');

      expect(mockModel.findOne).toHaveBeenCalledWith({
        name: 'Test School',
        _id: { $ne: '1' },
      });
    });
  });

  describe('findByTaxId', () => {
    it('should find school by tax_id', async () => {
      const school = { tax_id: '123' };

      mockModel.findOne.mockResolvedValue(school);

      const result = await repository.findByTaxId('123');

      expect(mockModel.findOne).toHaveBeenCalledWith({ tax_id: '123' });
      expect(result).toEqual(school);
    });

    it('should ignore id when provided', async () => {
      mockModel.findOne.mockResolvedValue(null);

      await repository.findByTaxId('123', '1');

      expect(mockModel.findOne).toHaveBeenCalledWith({
        tax_id: '123',
        _id: { $ne: '1' },
      });
    });
  });

  describe('findById', () => {
    it('should call findOne with ObjectId', async () => {
      const id = new mongoose.Types.ObjectId().toString();

      const school = { name: 'Test School' };

      mockModel.findOne.mockResolvedValue(school);

      const result = await repository.findById(id);

      expect(mockModel.findOne).toHaveBeenCalledWith({
        _id: expect.any(mongoose.Types.ObjectId),
      });

      expect(result).toEqual(school);
    });

    it('should include tokens when includeTokens is true', async () => {
      const id = '507f1f77bcf86cd799439011';

      const school = { name: 'Test School' };

      const mockQuery = {
        select: jest.fn().mockResolvedValue(school),
      };

      mockModel.findOne.mockReturnValue(mockQuery);

      const result = await repository.findById(id, true);

      expect(mockQuery.select).toHaveBeenCalledWith(
        '+refreshtoken +accesstoken',
      );
      expect(result).toEqual(school);
    });

    it('should throw CustomError when school does not exist', async () => {
      const id = '507f1f77bcf86cd799439011';

      mockModel.findOne.mockResolvedValue(null);

      await expect(repository.findById(id)).rejects.toThrow(CustomError);
    });
  });
});
