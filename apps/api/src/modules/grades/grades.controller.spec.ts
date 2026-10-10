import { Reflector } from '@nestjs/core';
import { RoleName } from '../../common/enums/role.enum';
import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';

describe('GradesController (RBAC - SEC-01)', () => {
  let controller: GradesController;
  let service: jest.Mocked<GradesService>;
  const reflector = new Reflector();

  beforeEach(() => {
    service = {
      recordGrade: jest.fn(),
      list: jest.fn(),
      getClassSubjectSummary: jest.fn(),
    } as unknown as jest.Mocked<GradesService>;

    controller = new GradesController(service);
  });

  it('has explicit @Roles on recordGrade', () => {
    const roles = reflector.get<RoleName[]>(ROLES_KEY, controller.recordGrade);
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

  it('has explicit @Roles on getSummary', () => {
    const roles = reflector.get<RoleName[]>(ROLES_KEY, controller.getSummary);
    expect(roles).toBeDefined();
    expect(roles).toEqual([
      RoleName.SUPER_ADMIN,
      RoleName.ADMIN,
      RoleName.MANAGER,
      RoleName.TEACHER,
    ]);
  });
});
