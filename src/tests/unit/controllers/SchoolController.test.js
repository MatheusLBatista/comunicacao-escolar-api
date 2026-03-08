import SchoolController from '../../../controllers/SchoolController.js';
import SchoolService from '../../../services/SchoolService.js';
import {
  CommonResponse,
  HttpStatusCodes,
} from '../../../utils/helpers/index.js';
import {
  SchoolIdSchema,
  SchoolQuerySchema,
} from '../../../utils/validators/schemas/zod/querys/SchoolQuerySchema.js';

jest.mock('../../../services/SchoolService.js');
jest.mock('../../../utils/helpers/index.js');
jest.mock('../../../utils/validators/schemas/zod/SchoolSchema.js', () => ({
  SchoolSchema: { parse: jest.fn((data) => data) },
  SchoolUpdateSchema: { parse: jest.fn((data) => data) },
}));
jest.mock(
  '../../../utils/validators/schemas/zod/querys/SchoolQuerySchema.js',
  () => ({
    SchoolIdSchema: { parse: jest.fn((data) => data) },
    SchoolQuerySchema: { parseAsync: jest.fn().mockResolvedValue({}) },
  }),
);

describe('SchoolController', () => {
  let controller;
  let mockService;
  let mockRes;
  let mockReq;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new SchoolController();
    mockService = SchoolService.mock.instances[0] || {
      create: jest.fn(),
      list: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    controller.service = mockService;

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockReq = {
      body: {},
      params: {},
      query: {},
    };
  });

  describe('create', () => {
    it('should create a school successfully', async () => {
      const schoolData = { name: 'Test School', city: 'Test City' };
      const mockSchool = {
        ...schoolData,
        toObject: jest.fn().mockReturnValue(schoolData),
      };

      mockService.create.mockResolvedValue(mockSchool);
      mockReq.body = schoolData;

      CommonResponse.created = jest.fn().mockReturnValue(mockRes);

      await controller.create(mockReq, mockRes);

      expect(mockService.create).toHaveBeenCalledWith(schoolData, mockReq);
      expect(CommonResponse.created).toHaveBeenCalledWith(mockRes, schoolData);
    });
  });

  describe('list', () => {
    it('should list schools successfully', async () => {
      const schoolsData = [{ id: '1', name: 'School 1' }];
      mockService.list.mockResolvedValue(schoolsData);

      CommonResponse.success = jest.fn().mockReturnValue(mockRes);

      await controller.list(mockReq, mockRes);

      expect(mockService.list).toHaveBeenCalledWith(mockReq);
      expect(CommonResponse.success).toHaveBeenCalledWith(mockRes, schoolsData);
    });

    it('should list schools with query params', async () => {
      mockReq.query = { city: 'Test City' };
      const schoolsData = [{ id: '1', name: 'School 1' }];
      mockService.list.mockResolvedValue(schoolsData);

      CommonResponse.success = jest.fn().mockReturnValue(mockRes);

      await controller.list(mockReq, mockRes);

      expect(SchoolQuerySchema.parseAsync).toHaveBeenCalledWith(mockReq.query);
      expect(mockService.list).toHaveBeenCalledWith(mockReq);
    });

    it('should validate and list a school by id', async () => {
      const schoolId = 'validObjectId';
      const schoolData = { id: schoolId, name: 'School 1' };

      mockReq.params = { id: schoolId };
      mockService.list.mockResolvedValue(schoolData);
      CommonResponse.success = jest.fn().mockReturnValue(mockRes);

      await controller.list(mockReq, mockRes);

      expect(SchoolIdSchema.parse).toHaveBeenCalledWith(schoolId);
      expect(mockService.list).toHaveBeenCalledWith(mockReq);
      expect(CommonResponse.success).toHaveBeenCalledWith(mockRes, schoolData);
    });

    it('should handle undefined params and query gracefully', async () => {
      const schoolsData = [{ id: '1', name: 'School 1' }];
      mockReq.params = undefined;
      mockReq.query = undefined;
      mockService.list.mockResolvedValue(schoolsData);
      CommonResponse.success = jest.fn().mockReturnValue(mockRes);

      await controller.list(mockReq, mockRes);

      expect(mockService.list).toHaveBeenCalledWith(mockReq);
      expect(CommonResponse.success).toHaveBeenCalledWith(mockRes, schoolsData);
    });
  });

  describe('update', () => {
    it('should update a school successfully', async () => {
      const schoolId = '1';
      const updateData = { name: 'Updated School' };
      const updatedSchool = { id: schoolId, ...updateData };

      mockReq.params = { id: schoolId };
      mockReq.body = updateData;
      mockService.update.mockResolvedValue(updatedSchool);

      CommonResponse.success = jest.fn().mockReturnValue(mockRes);

      await controller.update(mockReq, mockRes);

      expect(SchoolIdSchema.parse).toHaveBeenCalledWith(schoolId);
      expect(mockService.update).toHaveBeenCalledWith(
        schoolId,
        updateData,
        mockReq,
      );
      expect(CommonResponse.success).toHaveBeenCalledWith(
        mockRes,
        updatedSchool,
        HttpStatusCodes.OK.code,
        'School updated successfully.',
      );
    });
  });

  describe('delete', () => {
    it('should delete a school successfully', async () => {
      const schoolId = '1';
      const deletedSchool = { id: schoolId, name: 'Deleted School' };

      mockReq.params = { id: schoolId };
      mockService.delete.mockResolvedValue(deletedSchool);

      CommonResponse.success = jest.fn().mockReturnValue(mockRes);

      await controller.delete(mockReq, mockRes);

      expect(SchoolIdSchema.parse).toHaveBeenCalledWith(schoolId);
      expect(mockService.delete).toHaveBeenCalledWith(schoolId, mockReq);
      expect(CommonResponse.success).toHaveBeenCalledWith(
        mockRes,
        deletedSchool,
        HttpStatusCodes.OK.code,
        'School deleted successfully.',
      );
    });

    it('should handle undefined params in delete gracefully', async () => {
      const deletedSchool = { name: 'Deleted School' };
      mockReq.params = undefined;
      mockService.delete.mockResolvedValue(deletedSchool);
      CommonResponse.success = jest.fn().mockReturnValue(mockRes);

      await controller.delete(mockReq, mockRes);

      expect(mockService.delete).toHaveBeenCalledWith(undefined, mockReq);
    });
  });
});
