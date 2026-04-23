import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { ROLE_NAMES, type RoleName, type UsersListQueryDto } from '@nis/shared';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

interface Props {
  value: UsersListQueryDto;
  onChange: (next: UsersListQueryDto) => void;
}

export function UsersFilters({ value, onChange }: Props): React.ReactElement {
  const [search, setSearch] = useState(value.search ?? '');

  // Hold onChange + value in refs so the debounce effect fires only when the
  // search text changes, not every time the parent re-renders (which happens
  // whenever the paginated query refetches).
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  useEffect(() => {
    onChangeRef.current = onChange;
    valueRef.current = value;
  });

  useEffect(() => {
    const t = setTimeout(() => {
      const current = valueRef.current;
      if ((current.search ?? '') !== search) {
        onChangeRef.current({ ...current, search: search || undefined, page: 1 });
      }
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const selectRole = (event: ChangeEvent<HTMLSelectElement>): void => {
    const role = event.target.value as RoleName | '';
    onChange({ ...value, role: role || undefined, page: 1 });
  };

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[240px]">
        <Label htmlFor="users-search">Search</Label>
        <Input
          id="users-search"
          placeholder="Email or full name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="users-role">Role</Label>
        <select
          id="users-role"
          className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm"
          value={value.role ?? ''}
          onChange={selectRole}
        >
          <option value="">All roles</option>
          {ROLE_NAMES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
