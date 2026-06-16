import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import UserRepository from '../../repositories/UserRepository.js';
import mongoose from 'mongoose';

describe('UserRepository - listByClass with Admin Notifications', () => {
  let userRepository;
  let mockUserModel;
  let mockClassModel;

  beforeEach(() => {
    mockUserModel = {
      find: jest.fn()
    };
    mockClassModel = {
      findById: jest.fn()
    };
    userRepository = new UserRepository({ userModel: mockUserModel });
    userRepository.class = mockClassModel;
  });

  test('deve incluir admins da escola na lista de notificação da turma', async () => {
    const classId = new mongoose.Types.ObjectId().toString();
    const schoolId = new mongoose.Types.ObjectId().toString();
    const teacherId = new mongoose.Types.ObjectId().toString();
    
    // Mock da turma
    mockClassModel.findById.mockResolvedValue({
      _id: classId,
      school_id: schoolId,
      teacher_ids: [teacherId],
      name: 'Turma de Teste'
    });

    // Mock de Alunos (para listagem de responsáveis)
    mockUserModel.find.mockImplementation((query) => {
      if (query.memberships?.$elemMatch?.role === 'student') {
        return Promise.resolve([{ _id: 'student1' }]);
      }
      if (query.memberships?.$elemMatch?.role === 'parent') {
        return Promise.resolve([{ _id: 'parent1', full_name: 'Pai de Teste' }]);
      }
      if (query._id?.$in) {
        return Promise.resolve([{ _id: teacherId, full_name: 'Professor de Teste' }]);
      }
      if (query.memberships?.$elemMatch?.role === 'admin') {
        return Promise.resolve([{ _id: 'admin1', full_name: 'Admin de Teste' }]);
      }
      return Promise.resolve([]);
    });

    const users = await userRepository.listByClass(classId);

    // Verifica se os tipos de usuários esperados estão na lista
    const names = users.map(u => u.full_name);
    expect(names).toContain('Pai de Teste');
    expect(names).toContain('Professor de Teste');
    expect(names).toContain('Admin de Teste');
    
    // Verifica se a busca por admin foi feita corretamente para a escola certa
    expect(mockUserModel.find).toHaveBeenCalledWith(expect.objectContaining({
      memberships: expect.objectContaining({
        $elemMatch: expect.objectContaining({
          school_id: schoolId,
          role: 'admin'
        })
      })
    }));
  });
});
