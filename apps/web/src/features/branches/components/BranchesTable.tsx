import React, { useState } from 'react';
import type { BranchDto } from '@nis/shared';
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
          <h1 className="text-xl font-bold text-slate-900">Filiallar boshqaruvi</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Maktab binolari, filiallar va mustaqil tuzilmalarni sozlash
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Yangi filial qo‘shish</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <th scope="col" className="p-3.5 w-12 text-center">
                #
              </th>
              <th scope="col" className="p-3.5">
                Filial nomi
              </th>
              <th scope="col" className="p-3.5">
                Kodi
              </th>
              <th scope="col" className="p-3.5">
                Manzil
              </th>
              <th scope="col" className="p-3.5">
                Telefon
              </th>
              <th scope="col" className="p-3.5 text-center">
                Holati
              </th>
              <th scope="col" className="p-3.5 text-center">
                Amal
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
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
                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3.5 text-center text-xs font-medium text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-900">{b.name}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      {b.code}
                    </span>
                  </td>
                  <td className="p-3.5 text-xs text-slate-600">{b.address || '-'}</td>
                  <td className="p-3.5 text-xs font-mono text-slate-600">{b.phone || '-'}</td>
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        b.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {b.isActive ? 'Faol' : 'Faol emas'}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleEdit(b)}
                      className="min-h-[36px] px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Tahrirlash
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
