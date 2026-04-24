import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

/**
 * Supported feature flag keys.  Each maps to a boolean env var via
 * envValidationSchema (FEATURE_<KEY>_ENABLED).
 */
export type FeatureFlagKey =
  | 'TELEGRAM_LOGIN'
  | 'PARENT_PORTAL'
  | 'ATTENDANCE'
  | 'GRADES'
  | 'SCHEDULE'
  | 'WEBSOCKET';

const FEATURE_FLAG_METADATA_KEY = 'featureFlag';

/**
 * Decorator used on controller methods (or classes) to enforce that a feature
 * flag is enabled before the route is reachable.
 *
 * Usage: @RequireFeature('TELEGRAM_LOGIN')
 */
export const RequireFeature = (flag: FeatureFlagKey): MethodDecorator & ClassDecorator =>
  SetMetadata(FEATURE_FLAG_METADATA_KEY, flag);

/**
 * Single choke-point for all feature flag checks. Reads Joi-validated config
 * so values are type-safe booleans and cannot be spoofed via env injection.
 *
 * isTelegramLoginEnabled() / isParentPortalEnabled() etc. are provided for
 * service-layer callers that need an imperative check without using the guard.
 */
@Injectable()
export class FeatureFlagsService {
  constructor(private readonly config: ConfigService) {}

  isTelegramLoginEnabled(): boolean {
    return this.config.get<boolean>('FEATURE_TELEGRAM_LOGIN_ENABLED') === true;
  }

  isParentPortalEnabled(): boolean {
    return this.config.get<boolean>('FEATURE_PARENT_PORTAL_ENABLED') === true;
  }

  isAttendanceEnabled(): boolean {
    return this.config.get<boolean>('FEATURE_ATTENDANCE_ENABLED') === true;
  }

  isGradesEnabled(): boolean {
    return this.config.get<boolean>('FEATURE_GRADES_ENABLED') === true;
  }

  isScheduleEnabled(): boolean {
    return this.config.get<boolean>('FEATURE_SCHEDULE_ENABLED') === true;
  }

  isWebsocketEnabled(): boolean {
    return this.config.get<boolean>('FEATURE_WEBSOCKET_ENABLED') === true;
  }

  isEnabled(flag: FeatureFlagKey): boolean {
    switch (flag) {
      case 'TELEGRAM_LOGIN':
        return this.isTelegramLoginEnabled();
      case 'PARENT_PORTAL':
        return this.isParentPortalEnabled();
      case 'ATTENDANCE':
        return this.isAttendanceEnabled();
      case 'GRADES':
        return this.isGradesEnabled();
      case 'SCHEDULE':
        return this.isScheduleEnabled();
      case 'WEBSOCKET':
        return this.isWebsocketEnabled();
    }
  }
}

/**
 * Guard that reads the @RequireFeature metadata and blocks with HTTP 503 when
 * the named feature flag is disabled.  Register this on the controller (or
 * route handler) alongside JwtAuthGuard / RolesGuard.
 *
 * Throws ServiceUnavailableException (503) rather than returning false so that
 * Nest produces a descriptive JSON body instead of a bare 403.
 */
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureFlags: FeatureFlagsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const flag = this.reflector.getAllAndOverride<FeatureFlagKey | undefined>(
      FEATURE_FLAG_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!flag) {
      // No feature flag required on this route — allow through.
      return true;
    }

    if (!this.featureFlags.isEnabled(flag)) {
      throw new ServiceUnavailableException(`Feature ${flag} is disabled`);
    }

    return true;
  }
}
