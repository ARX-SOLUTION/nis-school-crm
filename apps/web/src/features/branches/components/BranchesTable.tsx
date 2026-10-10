import React, { useState } from 'react';
import type { BranchDto } from '@nis/shared';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useBranchesQuery } from '../api/use-branches-query';
import { CreateBranchModal } from './CreateBranchModal';

export function BranchesTable(): React.ReactElement {
  const { data: branches = [], isLoading } = useBranchesQuery();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchDto | null>(null);

  const handleEdit = (branch: BranchDto) => {
    setEditingBranch(branch);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingBranch(null);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-tertiary">Filiallar boshqaruvi</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Maktab binolari, filiallar va mustaqil tuzilmalarni sozlash
          </p>
        </div>

        <Button variant="primary" onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Yangi filial qo‘shish</span>
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th scope="col" className="px-2 sm:px-3 py-2.5 sm:py-3 w-12 text-center">
                  #
                </th>
                <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3">
                  Filial nomi
                </th>
                <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3">
                  Kodi
                </th>
                <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3">
                  Manzil
                </th>
                <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3">
                  Telefon
                </th>
                <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                  Holati
                </th>
                <th scope="col" className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                  Amal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-slate-400">
                    Filiallar yuklanmoqda...
                  </td>
                </tr>
              ) : branches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-slate-400">
                    Hozircha filiallar kiritilmagan.
                  </td>
                </tr>
              ) : (
                branches.map((b, idx) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-2 sm:px-3 py-2.5 sm:py-3 text-center text-xs font-medium text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                      <div className="font-semibold text-slate-100">{b.name}</div>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {b.code}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs text-slate-400">
                      {b.address || '-'}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-mono text-slate-400">
                      {b.phone || '-'}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                      {b.isActive ? (
                        <Badge variant="success" withDot>
                          Faol
                        </Badge>
                      ) : (
                        <Badge variant="neutral">Faol emas</Badge>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(b)}>
                        Tahrirlash
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modalOpen ? (
        <CreateBranchModal
          branch={editingBranch}
          onClose={() => {
            setModalOpen(false);
            setEditingBranch(null);
          }}
        />
      ) : null}
    </div>
  );
}
