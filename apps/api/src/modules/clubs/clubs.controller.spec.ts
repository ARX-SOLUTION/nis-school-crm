import { Reflector } from '@nestjs/core';
import { RoleName } from '../../common/enums/role.enum';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { ClubsController } from './clubs.controller';
import { ClubsService } from './clubs.service';

describe('ClubsController (RBAC - SEC-01)', () => {
  let controller: ClubsController;
  let service: jest.Mocked<ClubsService>;
  const reflector = new Reflector();

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      getStats: jest.fn(),
      checkConflicts: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      enrollStudent: jest.fn(),
      dropStudent: jest.fn(),
      recordAttendance: jest.fn(),
      getAttendanceHistory: jest.fn(),
    } as unknown as jest.Mocked<ClubsService>;

    controller = new ClubsController(service);
  });

  it('every endpoint has explicit @Roles defined', () => {
    const handlers = [
      controller.list,
      controller.getStats,
      controller.checkConflict,
      controller.getOne,
      controller.create,
      controller.update,
      controller.remove,
      controller.enroll,
      controller.drop,
      controller.recordAttendance,
      controller.getAttendance,
    ];

    for (const handler of handlers) {
      const roles = reflector.get<RoleName[]>(ROLES_KEY, handler);
      expect(roles).toBeDefined();
      expect(roles.length).toBeGreaterThan(0);
      expect(roles).toContain(RoleName.SUPER_ADMIN);
    }
  });
});
