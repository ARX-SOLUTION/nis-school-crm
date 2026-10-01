import { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useStudentsQuery } from '@/features/students/api/use-students-query';

export function Spotlight() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: studentsData, isLoading: isSearchingStudents } = useStudentsQuery(
    { search: debouncedSearch, limit: 5, page: 1 },
    { enabled: isOpen && debouncedSearch.trim().length > 1 },
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleCustomOpen = () => setIsOpen(true);
    window.addEventListener('open-spotlight', handleCustomOpen);
    return () => window.removeEventListener('open-spotlight', handleCustomOpen);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the dialog is rendered before showing it
      setTimeout(() => {
        if (dialogRef.current && !dialogRef.current.open) {
          dialogRef.current.showModal();
        }
      }, 10);
    } else {
      if (dialogRef.current && dialogRef.current.open) {
        dialogRef.current.close();
      }
      setTimeout(() => {
        setSearchQuery('');
        setDebouncedSearch('');
      }, 200);
    }
  }, [isOpen]);

  const closeSpotlight = () => setIsOpen(false);

  const handleNavigate = (path: string) => {
    closeSpotlight();
    navigate({ to: path });
  };

  const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      closeSpotlight();
    }
  };

  const navigationItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Students Directory', path: '/students' },
    { label: 'Leads Pipeline', path: '/leads' },
    { label: 'Branches', path: '/branches' },
    { label: 'Classes', path: '/classes' },
    { label: 'Settings', path: '/profile' },
  ];

  const filteredNav = useMemo(() => {
    if (!debouncedSearch.trim()) return navigationItems;
    return navigationItems.filter((item) =>
      item.label.toLowerCase().includes(debouncedSearch.toLowerCase()),
    );
  }, [debouncedSearch]);

  const students = studentsData?.data || [];
  const showLoading = isSearchingStudents;
  const hasNoResults =
    filteredNav.length === 0 && students.length === 0 && debouncedSearch.trim().length > 0;

  return (
    <dialog
      ref={dialogRef}
      // @ts-ignore
      closedby="any"
      onClose={closeSpotlight}
      onClick={handleDialogClick}
      className="backdrop:bg-tertiary/30 backdrop:backdrop-blur-[2px] shadow-2xl rounded-xl w-full max-w-2xl p-0 bg-surface/95 border border-border text-tertiary mx-auto mt-[10vh] overflow-hidden m-0 open:flex flex-col"
      style={{
        margin: '10vh auto auto auto',
      }}
    >
      <div className="flex items-center px-4 py-3 border-b border-border">
        {showLoading ? (
          <span className="mr-3 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : (
          <svg
            className="h-5 w-5 text-neutral-400 mr-3 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        )}
        <input
          type="text"
          placeholder="Search commands, students... (Cmd+K)"
          className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-neutral-400 focus:ring-0 p-0"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
        <kbd className="hidden sm:inline-block px-2 py-1 text-[10px] font-medium text-neutral-500 bg-muted-surface rounded-lg border border-border ml-3 shrink-0">
          ESC
        </kbd>
      </div>

      <div className="p-2 overflow-y-auto max-h-[60vh]">
        {hasNoResults && !showLoading ? (
          <div className="py-12 text-center">
            <p className="text-sm text-neutral-500">No results found for "{searchQuery}"</p>
          </div>
        ) : (
          <>
            {filteredNav.length > 0 && (
              <div className="mb-4">
                <h3 className="px-3 text-xs font-semibold text-neutral-500 tracking-wider mb-2 uppercase">
                  Navigation
                </h3>
                <ul className="space-y-1">
                  {filteredNav.map((item) => (
                    <li key={item.path}>
                      <button
                        onClick={() => handleNavigate(item.path)}
                        className="w-full flex items-center px-3 py-2.5 text-sm rounded-xl hover:bg-muted-surface/80 transition-colors text-left focus:bg-muted-surface/80 focus:outline-none"
                      >
                        <svg
                          className="h-4 w-4 mr-3 text-neutral-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        <span className="font-medium text-tertiary">{item.label}</span>
                        <svg
                          className="h-4 w-4 ml-auto text-border"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {students.length > 0 && (
              <div className="mb-4">
                <h3 className="px-3 text-xs font-semibold text-neutral-500 tracking-wider mb-2 uppercase">
                  Students
                </h3>
                <ul className="space-y-1">
                  {students.map((student: import('@nis/shared').StudentResponseDto) => (
                    <li key={student.id}>
                      <button
                        onClick={() => handleNavigate(`/students`)}
                        className="w-full flex items-center px-3 py-2.5 text-sm rounded-xl hover:bg-muted-surface/80 transition-colors text-left focus:bg-muted-surface/80 focus:outline-none"
                      >
                        <div className="h-8 w-8 rounded-full bg-[#E8F7D0] text-success flex items-center justify-center font-bold text-xs mr-3 shrink-0">
                          {student.firstName[0]}
                          {student.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium text-tertiary">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            ID: {student.studentCode}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </dialog>
  );
}
