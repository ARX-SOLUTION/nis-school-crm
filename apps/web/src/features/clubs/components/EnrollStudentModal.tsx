import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ClubDto, StudentResponseDto } from '@nis/shared';
import { clubsApi } from '../api/clubs-api';

interface EnrollStudentModalProps {
  club: ClubDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EnrollStudentModal: React.FC<EnrollStudentModalProps> = ({
  club,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [students, setStudents] = useState<StudentResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSelectedStudentId('');
      setSearchTerm('');
      fetchStudents();
    }
  }, [isOpen]);

  // Escape key listener (Anti-Slop R-32 Keyboard Accessibility)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data: StudentResponseDto[] }>('/students', {
        params: { limit: 150 },
      });
      // Handle both paginated response or flat array
      const list = Array.isArray(res.data) ? res.data : res.data.data || [];
      setStudents(list);
    } catch {
      setError("O'quvchilar ro'yxatini yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter students by search term
  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const code = (s.studentCode || '').toLowerCase();
    return fullName.includes(term) || code.includes(term);
  });

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      setError("Iltimos, o'quvchini tanlang");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await clubsApi.enrollStudent(club.id, { studentId: selectedStudentId });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(msg || "O'quvchini to'garakka yozishda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const spotsLeft = Math.max(club.capacity - club.enrolledCount, 0);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="enroll-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg bg-slate-900 rounded-xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 id="enroll-modal-title" className="text-base font-semibold text-slate-100">
              O'quvchini to'garakka yozish
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {club.name} • {club.minGrade}-{club.maxGrade} sinflar
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Modalni yopish"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 overflow-y-auto space-y-3.5 sm:space-y-4"
        >
          {error && (
            <div className="p-3 text-xs rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 flex items-start gap-2">
              <svg
                className="w-4 h-4 text-red-400 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Quick Info Box */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block">Bo'sh o'rinlar:</span>
              <span className="font-semibold text-slate-200 tabular-nums">
                {spotsLeft} ta (Jami sig'im: {club.capacity})
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Sinf chegarasi:</span>
              <span className="font-semibold text-slate-200">
                {club.minGrade} - {club.maxGrade} sinflar
              </span>
            </div>
          </div>

          {/* Search box */}
          <div>
            <label
              htmlFor="student-search-input"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              O'quvchini qidirish:
            </label>
            <input
              id="student-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ism, familiya yoki o'quvchi ID..."
              className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 text-slate-100 rounded-lg focus:outline-hidden focus:border-blue-500 transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Student selection list */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              O'quvchini tanlang:
            </label>
            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                O'quvchilar ro'yxati yuklanmoqda...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
                O'quvchi topilmadi
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-800 border border-slate-800 rounded-lg">
                {filteredStudents.map((st) => {
                  const isSelected = selectedStudentId === st.id;
                  const isGradeEligible =
                    st.gradeLevel >= club.minGrade && st.gradeLevel <= club.maxGrade;

                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(st.id);
                        setError(null);
                      }}
                      className={`w-full text-left px-3 py-2.5 flex items-center justify-between text-xs transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white font-medium'
                          : 'hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-medium">
                          {st.firstName} {st.lastName}
                        </div>
                        <div
                          className={`text-[11px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}
                        >
                          ID: {st.studentCode} • {st.gradeLevel}-sinf
                        </div>
                      </div>

                      {!isGradeEligible && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            isSelected
                              ? 'bg-blue-800 text-white'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          Sinf mos emas
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedStudent && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-emerald-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>
                Tanlandi:{' '}
                <strong>
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </strong>{' '}
                ({selectedStudent.gradeLevel}-sinf)
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedStudentId}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Yozilmoqda...' : "A'zo sifatida qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
