import type { UsersListQueryDto } from '@nis/shared';

/**
 * Invalidation strategy:
 *  - After create / delete → invalidate `lists()` (any filter).
 *  - After update         → invalidate the specific `detail(id)` +
 *                           optionally `lists()` if the row might have
 *                           shifted between filter buckets.
 */
export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (query: UsersListQueryDto) => [...usersKeys.lists(), query] as const,
  detail: (id: string) => [...usersKeys.all, 'detail', id] as const,
};
