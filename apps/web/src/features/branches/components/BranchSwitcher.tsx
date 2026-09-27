import React, { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useBranchesQuery } from '../api/use-branches-query';

export function BranchSwitcher(): React.ReactElement {
  const { data: branches = [] } = useBranchesQuery(true);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeBranchId, setActiveBranchId] = useState<string>(() => {
    try {
      return localStorage.getItem('nis_active_branch_id') || 'all';
    } catch {
      return 'all';
    }
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    setActiveBranchId(id);
    try {
      localStorage.setItem('nis_active_branch_id', id);
    } catch {
      // ignore
    }
    setOpen(false);
  };

  const activeBranch = branches.find((b) => b.id === activeBranchId);
  const displayName =
    activeBranchId === 'all' || !activeBranch
      ? 'Barcha filiallar'
      : activeBranch.name.replace(/^Nordic International School\s*[-—]\s*/i, '');

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Filialni tanlash"
        className="min-h-[44px] flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200/80 bg-slate-50/70 hover:bg-slate-100 text-slate-800 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        aria-haspopup="true"
        aria-expanded={open}
        title="Filialni tanlash"
      >
        {/* Building Icon */}
        <svg
          className="h-4 w-4 text-blue-600 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>

        <span className="truncate max-w-[150px] font-semibold">{displayName}</span>

        {/* Chevron Icon */}
        <svg
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-150 ${
            open ? 'rotate-180 text-blue-600' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <div
          className="absolute left-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
          role="menu"
        >
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Filiallar (Branches)
          </div>

          <button
            type="button"
            onClick={() => handleSelect('all')}
            className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
              activeBranchId === 'all' ? 'font-bold text-blue-700 bg-blue-50/50' : 'text-slate-700'
            }`}
            role="menuitem"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              <span>Barcha filiallar (Umumiy)</span>
            </div>
            {activeBranchId === 'all' ? (
              <svg
                className="h-4 w-4 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : null}
          </button>

          <div className="my-1 border-t border-slate-100" />

          {branches.map((b) => {
            const isSelected = b.id === activeBranchId;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handleSelect(b.id)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  isSelected ? 'font-bold text-blue-700 bg-blue-50/50' : 'text-slate-700'
                }`}
                role="menuitem"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <div className="truncate">
                    <div>{b.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{b.code}</div>
                  </div>
                </div>
                {isSelected ? (
                  <svg
                    className="h-4 w-4 text-blue-600 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : null}
              </button>
            );
          })}

          <div className="my-1 border-t border-slate-100" />

          <Link
            to="/branches"
            onClick={() => setOpen(false)}
            className="w-full text-left px-3 py-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 flex items-center gap-1.5 font-medium transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Filiallarni boshqarish</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
