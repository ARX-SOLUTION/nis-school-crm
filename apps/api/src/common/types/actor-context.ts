import { RoleName } from '../enums/role.enum';

/** The minimal authenticated principal a service needs to enforce policy. */
export interface ActorContext {
  id: string;
  role: RoleName;
}
