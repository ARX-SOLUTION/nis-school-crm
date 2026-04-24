import { ExecutionContext, ServiceUnavailableException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  FeatureFlagsService,
  FeatureFlagGuard,
  FeatureFlagKey,
  RequireFeature,
} from './feature-flags.service';

// ---------------------------------------------------------------------------
// FeatureFlagsService
// ---------------------------------------------------------------------------

function buildFlagsService(overrides: Partial<Record<string, boolean>> = {}): FeatureFlagsService {
  const defaults: Record<string, boolean> = {
    FEATURE_TELEGRAM_LOGIN_ENABLED: false,
    FEATURE_PARENT_PORTAL_ENABLED: false,
    FEATURE_ATTENDANCE_ENABLED: false,
    FEATURE_GRADES_ENABLED: false,
    FEATURE_SCHEDULE_ENABLED: false,
    FEATURE_WEBSOCKET_ENABLED: false,
    ...overrides,
  };
  const config = {
    get: jest.fn((key: string) => defaults[key]),
  } as unknown as ConfigService;
  return new FeatureFlagsService(config);
}

describe('FeatureFlagsService', () => {
  it('should_return_true_when_FEATURE_TELEGRAM_LOGIN_ENABLED_is_true', () => {
    const service = buildFlagsService({ FEATURE_TELEGRAM_LOGIN_ENABLED: true });
    expect(service.isTelegramLoginEnabled()).toBe(true);
  });

  it('should_return_false_when_FEATURE_TELEGRAM_LOGIN_ENABLED_is_false', () => {
    const service = buildFlagsService({ FEATURE_TELEGRAM_LOGIN_ENABLED: false });
    expect(service.isTelegramLoginEnabled()).toBe(false);
  });

  it('should_return_true_when_FEATURE_PARENT_PORTAL_ENABLED_is_true', () => {
    const service = buildFlagsService({ FEATURE_PARENT_PORTAL_ENABLED: true });
    expect(service.isParentPortalEnabled()).toBe(true);
  });

  it('should_return_false_when_FEATURE_PARENT_PORTAL_ENABLED_is_false', () => {
    const service = buildFlagsService();
    expect(service.isParentPortalEnabled()).toBe(false);
  });

  describe('isEnabled — all flag variants', () => {
    const cases: [FeatureFlagKey, string][] = [
      ['TELEGRAM_LOGIN', 'FEATURE_TELEGRAM_LOGIN_ENABLED'],
      ['PARENT_PORTAL', 'FEATURE_PARENT_PORTAL_ENABLED'],
      ['ATTENDANCE', 'FEATURE_ATTENDANCE_ENABLED'],
      ['GRADES', 'FEATURE_GRADES_ENABLED'],
      ['SCHEDULE', 'FEATURE_SCHEDULE_ENABLED'],
      ['WEBSOCKET', 'FEATURE_WEBSOCKET_ENABLED'],
    ];

    test.each(cases)('should_return_true_for_%s_when_env_key_is_true', (flagKey, envKey) => {
      const service = buildFlagsService({ [envKey]: true });
      expect(service.isEnabled(flagKey)).toBe(true);
    });

    test.each(cases)('should_return_false_for_%s_when_env_key_is_false', (flagKey, envKey) => {
      const service = buildFlagsService({ [envKey]: false });
      expect(service.isEnabled(flagKey)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// FeatureFlagGuard
// ---------------------------------------------------------------------------

function buildGuard(flagEnabled: boolean, metadataFlag: FeatureFlagKey | undefined) {
  const flagsService = buildFlagsService(
    metadataFlag ? { [`FEATURE_${metadataFlag}_ENABLED`]: flagEnabled } : {},
  );

  const reflector = {
    getAllAndOverride: jest.fn(() => metadataFlag),
  } as unknown as Reflector;

  const guard = new FeatureFlagGuard(reflector, flagsService);

  const mockContext = {
    getHandler: jest.fn(() => ({})),
    getClass: jest.fn(() => ({})),
  } as unknown as ExecutionContext;

  return { guard, reflector, mockContext };
}

describe('FeatureFlagGuard', () => {
  it('should_allow_through_when_no_feature_flag_metadata_is_set', () => {
    const { guard, mockContext } = buildGuard(false, undefined);
    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should_allow_through_when_flag_is_enabled', () => {
    const { guard, mockContext } = buildGuard(true, 'TELEGRAM_LOGIN');
    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should_throw_ServiceUnavailableException_when_TELEGRAM_LOGIN_flag_is_disabled', () => {
    const { guard, mockContext } = buildGuard(false, 'TELEGRAM_LOGIN');
    expect(() => guard.canActivate(mockContext)).toThrow(ServiceUnavailableException);
  });

  it('should_throw_ServiceUnavailableException_when_PARENT_PORTAL_flag_is_disabled', () => {
    const { guard, mockContext } = buildGuard(false, 'PARENT_PORTAL');
    expect(() => guard.canActivate(mockContext)).toThrow(ServiceUnavailableException);
  });

  it('should_call_reflector_with_correct_metadata_key', () => {
    const { guard, reflector, mockContext } = buildGuard(true, 'TELEGRAM_LOGIN');
    guard.canActivate(mockContext);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith('featureFlag', [
      mockContext.getHandler(),
      mockContext.getClass(),
    ]);
  });

  it('should_throw_ServiceUnavailableException_with_flag_name_in_message', () => {
    const { guard, mockContext } = buildGuard(false, 'ATTENDANCE');
    expect(() => guard.canActivate(mockContext)).toThrow(/ATTENDANCE/);
  });
});

// ---------------------------------------------------------------------------
// RequireFeature decorator
// ---------------------------------------------------------------------------

describe('RequireFeature decorator', () => {
  it('should_be_usable_as_a_method_decorator_without_throwing', () => {
    // We verify that the decorator factory does not blow up at decoration time.
    // Actual metadata is tested through the guard above.
    expect(() => {
      class TestController {
        @(RequireFeature('TELEGRAM_LOGIN') as MethodDecorator)
        handler() {}
      }
      return TestController;
    }).not.toThrow();
  });
});
