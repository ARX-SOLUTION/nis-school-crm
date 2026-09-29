import React from 'react';
import { BranchesTable } from '@/features/branches/components/BranchesTable';

export function BranchesPage(): React.ReactElement {
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <BranchesTable />
    </div>
  );
}
