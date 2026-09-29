import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClassEntity } from '../classes/entities/class.entity';
import { Student } from '../students/entities/student.entity';
import { BranchesService } from './branches.service';
import { Branch } from './entities/branch.entity';

describe('BranchesService', () => {
  let service: BranchesService;
  let mockBranchRepo: Record<string, jest.Mock>;
  let mockStudentRepo: Record<string, jest.Mock>;
  let mockClassRepo: Record<string, jest.Mock>;

  const mockBranch = {
    id: 'branch-uuid-1',
    name: 'Nordic Bosh Bino',
    code: 'MAIN',
    address: 'Bunyodkor shoh ko‘chasi',
    phone: '+998 71 200 00 00',
    isActive: true,
  };

  beforeEach(async () => {
    mockBranchRepo = {
      createQueryBuilder: jest.fn(() => ({
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockBranch]),
      })),
      findOne: jest.fn(),
      create: jest.fn((dto) => ({ ...dto, id: 'branch-uuid-new' })),
      save: jest.fn((entity) => Promise.resolve({ ...entity, id: entity.id || 'branch-uuid-new' })),
    };

    mockStudentRepo = {
      count: jest.fn().mockResolvedValue(150),
    };

    mockClassRepo = {
      count: jest.fn().mockResolvedValue(12),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BranchesService,
        { provide: getRepositoryToken(Branch), useValue: mockBranchRepo },
        { provide: getRepositoryToken(Student), useValue: mockStudentRepo },
        { provide: getRepositoryToken(ClassEntity), useValue: mockClassRepo },
      ],
    }).compile();

    service = module.get<BranchesService>(BranchesService);
  });

  it('findAll returns branches', async () => {
    const list = await service.findAll();
    expect(list).toEqual([mockBranch]);
  });

  it('findOne returns branch if found', async () => {
    mockBranchRepo.findOne.mockResolvedValue(mockBranch);
    const branch = await service.findOne('branch-uuid-1');
    expect(branch).toEqual(mockBranch);
  });

  it('create saves new branch', async () => {
    mockBranchRepo.findOne.mockResolvedValue(null);
    const res = await service.create({
      name: 'Yunusobod Filiali',
      code: 'YUNUSOBOD',
    });
    expect(res.name).toBe('Yunusobod Filiali');
    expect(mockBranchRepo.save).toHaveBeenCalled();
  });

  it('getStats returns student and class counts', async () => {
    mockBranchRepo.findOne.mockResolvedValue(mockBranch);
    const stats = await service.getStats('branch-uuid-1');
    expect(stats.activeStudents).toBe(150);
    expect(stats.classesCount).toBe(12);
  });
});
