import { Reflector } from '@nestjs/core';
import { RoleName } from '../../common/enums/role.enum';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';

describe('BranchesController (RBAC - SEC-01)', () => {
  let controller: BranchesController;
  let service: jest.Mocked<BranchesService>;
  const reflector = new Reflector();

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      getStats: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<BranchesService>;

    controller = new BranchesController(service);
  });

  it('every endpoint has explicit @Roles defined', () => {
    const handlers = [
      controller.findAll,
      controller.findOne,
      controller.getStats,
      controller.create,
      controller.update,
      controller.remove,
    ];

    for (const handler of handlers) {
      const roles = reflector.get<RoleName[]>(ROLES_KEY, handler);
      expect(roles).toBeDefined();
      expect(roles.length).toBeGreaterThan(0);
      expect(roles).toContain(RoleName.SUPER_ADMIN);
    }
  });
});
