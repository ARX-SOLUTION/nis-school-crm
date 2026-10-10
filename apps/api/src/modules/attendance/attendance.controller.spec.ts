import { Reflector } from '@nestjs/core';
import { RoleName } from '../../common/enums/role.enum';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

describe('AttendanceController (RBAC - SEC-01)', () => {
  let controller: AttendanceController;
  let service: jest.Mocked<AttendanceService>;
  const reflector = new Reflector();

  beforeEach(() => {
    service = {
      bulkRecord: jest.fn(),
      list: jest.fn(),
      getStats: jest.fn(),
    } as unknown as jest.Mocked<AttendanceService>;

    controller = new AttendanceController(service);
  });

  it('has explicit @Roles on bulkRecord', () => {
    const roles = reflector.get<RoleName[]>(ROLES_KEY, controller.bulkRecord);
    expect(roles).toBeDefined();
    expect(roles).toEqual([
      RoleName.SUPER_ADMIN,
      RoleName.ADMIN,
      RoleName.MANAGER,
      RoleName.TEACHER,
    ]);
  });

  it('has explicit @Roles on list', () => {
    const roles = reflector.get<RoleName[]>(ROLES_KEY, controller.list);
    expect(roles).toBeDefined();
    expect(roles).toEqual([
      RoleName.SUPER_ADMIN,
      RoleName.ADMIN,
      RoleName.MANAGER,
      RoleName.TEACHER,
    ]);
  });

  it('has explicit @Roles on getStats with PARENT role included', () => {
    const roles = reflector.get<RoleName[]>(ROLES_KEY, controller.getStats);
    expect(roles).toBeDefined();
    expect(roles).toEqual([
      RoleName.SUPER_ADMIN,
      RoleName.ADMIN,
      RoleName.MANAGER,
      RoleName.TEACHER,
      RoleName.PARENT,
    ]);
  });
});
