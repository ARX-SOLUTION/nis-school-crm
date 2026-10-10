import React from 'react';
import { BranchesTable } from '@/features/branches/components/BranchesTable';

export function BranchesPage(): React.ReactElement {
  return (
    <div className="space-y-4">
      <BranchesTable />
    </div>
  );
}
