import React, { useEffect, useState } from 'react';
import {
  ClubAttendanceRecordDto,
  ClubAttendanceStatus,
  ClubDto,
  ClubFeeType,
  EnrollmentStatus,
} from '@nis/shared';
import { clubsApi } from '../api/clubs-api';

interface ClubDetailsModalProps {
  club: ClubDto | null;
  isOpen: boolean;
  onClose: () => void;
  onEnrollClick: (club: ClubDto) => void;
  onRefresh: () => void;
}

type TabType = 'students' | 'schedule' | 'attendance' | 'billing';

const DAY_FULL_LABELS: Record<number, string> = {
  1: 'Dushanba',
  2: 'Seshanba',
  3: 'Chorshanba',
  4: 'Payshanba',
  5: 'Juma',
  6: 'Shanba',
};

export const ClubDetailsModal: React.FC<ClubDetailsModalProps> = ({
  club,
  isOpen,
  onClose,
  onEnrollClick,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('students');
  const [currentClub, setCurrentClub] = useState<ClubDto | null>(club);
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );
  const [attendanceMap, setAttendanceMap] = useState<Record<string, ClubAttendanceStatus>>({});
  const [attendanceRemarks, setAttendanceRemarks] = useState<Record<string, string>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceSuccess, setAttendanceSuccess] = useState(false);
  const [droppingStudentId, setDroppingStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (club) {
      setCurrentClub(club);
    }
  }, [club]);

  // Load latest club details when modal opens
  useEffect(() => {
    if (isOpen && club) {
      loadClubDetails(club.id);
      loadAttendance(club.id, attendanceDate);
    }
  }, [isOpen, club, attendanceDate]);

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

  const loadClubDetails = async (clubId: string) => {
    try {
      const data = await clubsApi.getById(clubId);
      setCurrentClub(data);
    } catch (err) {
      console.error('Failed to load club details', err);
    }
  };

  const loadAttendance = async (clubId: string, date: string) => {
    try {
      const records = await clubsApi.getAttendance(clubId, date);
      const newMap: Record<string, ClubAttendanceStatus> = {};
      const newRemarks: Record<string, string> = {};

      records.forEach((r: ClubAttendanceRecordDto) => {
        newMap[r.studentId] = r.status;
        if (r.remarks) newRemarks[r.studentId] = r.remarks;
      });

      setAttendanceMap(newMap);
      setAttendanceRemarks(newRemarks);
    } catch (err) {
      console.error('Failed to load attendance', err);
    }
  };

  if (!isOpen || !currentClub) return null;

  const activeEnrollments = (currentClub.enrollments || []).filter(
    (e) => e.status === EnrollmentStatus.ACTIVE,
  );

  const handleMarkAllPresent = () => {
    const updated: Record<string, ClubAttendanceStatus> = {};
    activeEnrollments.forEach((e) => {
      updated[e.studentId] = ClubAttendanceStatus.PRESENT;
    });
    setAttendanceMap(updated);
  };

  const handleSetStudentStatus = (studentId: string, status: ClubAttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    try {
      setSavingAttendance(true);
      setAttendanceSuccess(false);

      const records = activeEnrollments.map((e) => ({
        studentId: e.studentId,
        status: attendanceMap[e.studentId] || ClubAttendanceStatus.PRESENT,
        remarks: attendanceRemarks[e.studentId] || '',
      }));

      await clubsApi.recordAttendance(currentClub.id, {
        date: attendanceDate,
        records,
      });

      setAttendanceSuccess(true);
      setTimeout(() => setAttendanceSuccess(false), 3000);
      onRefresh();
    } catch (err) {
      console.error('Failed to save attendance', err);
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleDropStudent = async (studentId: string) => {
    if (!window.confirm("Rostdan ham ushbu o'quvchini to'garakdan chiqarmoqchimisiz?")) {
      return;
    }

    try {
      setDroppingStudentId(studentId);
      await clubsApi.dropStudent(currentClub.id, studentId);
      await loadClubDetails(currentClub.id);
      onRefresh();
    } catch (err) {
      console.error('Failed to drop student', err);
    } finally {
      setDroppingStudentId(null);
    }
  };

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + " so'm";
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="club-details-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tertiary/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-4xl bg-surface rounded-xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border flex items-start justify-between bg-muted-surface">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-border text-tertiary">
                {currentClub.category}
              </span>
              {currentClub.feeType === ClubFeeType.PAID ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#D9F2B3] text-success tabular-nums">
                  {formatPrice(currentClub.monthlyFee)}/oy
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted-surface text-tertiary">
                  Bepul
                </span>
              )}
            </div>
            <h2 id="club-details-title" className="text-xl font-bold text-tertiary">
              {currentClub.name}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Murabbiy:{' '}
              <span className="text-tertiary font-medium">
                {currentClub.instructorName || 'Belgilanmagan'}
              </span>{' '}
              • Xona:{' '}
              <span className="text-tertiary font-medium">
                {currentClub.roomNumber || 'Belgilanmagan'}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-500 rounded-lg hover:bg-muted-surface transition-colors"
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

        {/* Tab Navigation */}
        <div className="px-6 border-b border-border bg-surface flex items-center justify-between gap-2 overflow-x-auto">
          <nav className="flex space-x-6 text-sm font-medium" aria-label="Tabs">
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'students'
                  ? 'border-border text-tertiary font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-tertiary'
              }`}
            >
              <span>A'zolar (O'quvchilar)</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-muted-surface text-tertiary tabular-nums">
                {activeEnrollments.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'schedule'
                  ? 'border-border text-tertiary font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-tertiary'
              }`}
            >
              <span>Mashg'ulot Jadvali</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-muted-surface text-tertiary tabular-nums">
                {currentClub.schedules?.length || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'attendance'
                  ? 'border-border text-tertiary font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-tertiary'
              }`}
            >
              <span>Davomat Jurnali</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('billing')}
              className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'billing'
                  ? 'border-border text-tertiary font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-tertiary'
              }`}
            >
              <span>To'lovlar & Moliya</span>
            </button>
          </nav>

          {activeTab === 'students' && (
            <button
              type="button"
              onClick={() => onEnrollClick(currentClub)}
              className="my-2 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-tertiary hover:bg-tertiary transition-colors"
            >
              + O'quvchi qo'shish
            </button>
          )}
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: O'quvchilar ro'yxati */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-neutral-500 pb-2 border-b border-border">
                <span>
                  To'garak sig'imi:{' '}
                  <strong>
                    {activeEnrollments.length} / {currentClub.capacity} nafar
                  </strong>
                </span>
                <span>
                  Sinf oralig'i:{' '}
                  <strong>
                    {currentClub.minGrade} - {currentClub.maxGrade} sinflar
                  </strong>
                </span>
              </div>

              {activeEnrollments.length === 0 ? (
                <div className="py-12 text-center text-neutral-400 bg-muted-surface rounded-xl border border-dashed border-border">
                  <p className="text-sm font-medium text-neutral-500 mb-1">
                    Hozircha a'zo bo'lgan o'quvchilar yo'q
                  </p>
                  <p className="text-xs text-neutral-400 mb-3">
                    Ushbu to'garakka birinchi o'quvchini qo'shing
                  </p>
                  <button
                    type="button"
                    onClick={() => onEnrollClick(currentClub)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-tertiary hover:bg-tertiary transition-colors"
                  >
                    O'quvchi yozish
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-border rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted-surface text-neutral-500 font-semibold border-b border-border">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">O'quvchi</th>
                        <th className="px-4 py-3">Sinfi</th>
                        <th className="px-4 py-3">Ota-ona telefoni</th>
                        <th className="px-4 py-3">Yozilgan sana</th>
                        <th className="px-4 py-3 text-right">Amal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeEnrollments.map((en, index) => (
                        <tr key={en.id} className="hover:bg-muted-surface transition-colors">
                          <td className="px-4 py-3 text-neutral-400 tabular-nums">{index + 1}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-tertiary">{en.studentName}</div>
                            <div className="text-[11px] text-neutral-400 tabular-nums">
                              ID: {en.studentCode}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-0.5 rounded-lg bg-muted-surface text-tertiary font-medium">
                              {en.className || `${en.gradeLevel}-sinf`}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-neutral-500 tabular-nums">
                            {en.parentPhone || 'Kiritilmagan'}
                          </td>
                          <td className="px-4 py-3 text-neutral-500 tabular-nums">
                            {new Date(en.enrolledAt).toLocaleDateString('uz-UZ')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleDropStudent(en.studentId)}
                              disabled={droppingStudentId === en.studentId}
                              className="px-2.5 py-1 text-xs text-error hover:text-error hover:bg-[#FEE2E2] rounded-lg transition-colors"
                            >
                              {droppingStudentId === en.studentId
                                ? 'Chiqarilmoqda...'
                                : 'Chiqarish'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Mashg'ulot jadvali */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <p className="text-xs text-neutral-500">
                To'garak mashg'ulotlari darsdan keyingi vaqtlarda o'tiladi.
              </p>

              {!currentClub.schedules || currentClub.schedules.length === 0 ? (
                <div className="py-10 text-center text-xs text-neutral-400 bg-muted-surface rounded-xl border border-dashed border-border">
                  Ushbu to'garak uchun jadval belgilanmagan
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentClub.schedules.map((s) => (
                    <div
                      key={s.id}
                      className="p-4 bg-muted-surface border border-border rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted-surface text-secondary font-bold flex items-center justify-center text-sm border border-border">
                          {DAY_FULL_LABELS[s.dayOfWeek]?.substring(0, 2) || s.dayOfWeek}
                        </div>
                        <div>
                          <div className="font-semibold text-tertiary text-sm">
                            {DAY_FULL_LABELS[s.dayOfWeek] || `Kun: ${s.dayOfWeek}`}
                          </div>
                          <div className="text-xs text-neutral-500">
                            Xona: {s.roomNumber || currentClub.roomNumber || 'Standart xona'}
                          </div>
                        </div>
                      </div>

                      <div className="px-3 py-1.5 rounded-lg bg-surface border border-border font-semibold text-tertiary text-xs tabular-nums shadow-2xs">
                        {s.startTime} - {s.endTime}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Davomat Jurnali */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {/* Date & Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted-surface rounded-xl border border-border">
                <div className="flex items-center gap-2">
                  <label htmlFor="attendance-date" className="text-xs font-semibold text-tertiary">
                    Sana:
                  </label>
                  <input
                    id="attendance-date"
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-border tabular-nums"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleMarkAllPresent}
                    className="px-3 py-1.5 text-xs font-medium text-success bg-[#E8F7D0] hover:bg-[#D9F2B3] border border-success rounded-lg transition-colors"
                  >
                    Barchasi bor
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAttendance}
                    disabled={savingAttendance || activeEnrollments.length === 0}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-tertiary hover:bg-tertiary rounded-lg transition-colors disabled:opacity-50"
                  >
                    {savingAttendance ? 'Saqlanmoqda...' : 'Davomatni saqlash'}
                  </button>
                </div>
              </div>

              {attendanceSuccess && (
                <div className="p-3 text-xs bg-[#E8F7D0] border border-success text-success rounded-lg flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-success shrink-0"
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
                  <span>Davomat muvaffaqiyatli saqlandi!</span>
                </div>
              )}

              {activeEnrollments.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400 bg-muted-surface rounded-xl border border-dashed border-border">
                  To'garakda a'zolar yo'q
                </div>
              ) : (
                <div className="overflow-x-auto border border-border rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted-surface text-neutral-500 font-semibold border-b border-border">
                      <tr>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">O'quvchi</th>
                        <th className="px-4 py-3">Sinfi</th>
                        <th className="px-4 py-3">Holati</th>
                        <th className="px-4 py-3">Izoh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeEnrollments.map((en, idx) => {
                        const status = attendanceMap[en.studentId] || ClubAttendanceStatus.PRESENT;

                        return (
                          <tr key={en.id} className="hover:bg-muted-surface transition-colors">
                            <td className="px-4 py-3 text-neutral-400 tabular-nums">{idx + 1}</td>
                            <td className="px-4 py-3 font-medium text-tertiary">
                              {en.studentName}
                            </td>
                            <td className="px-4 py-3 text-neutral-500">
                              {en.className || `${en.gradeLevel}-sinf`}
                            </td>
                            <td className="px-4 py-3">
                              <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted-surface">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSetStudentStatus(
                                      en.studentId,
                                      ClubAttendanceStatus.PRESENT,
                                    )
                                  }
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                                    status === ClubAttendanceStatus.PRESENT
                                      ? 'bg-success text-white shadow-xs'
                                      : 'text-neutral-500 hover:text-tertiary'
                                  }`}
                                >
                                  Bor
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSetStudentStatus(
                                      en.studentId,
                                      ClubAttendanceStatus.ABSENT,
                                    )
                                  }
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                                    status === ClubAttendanceStatus.ABSENT
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'text-neutral-500 hover:text-tertiary'
                                  }`}
                                >
                                  Yo'q
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSetStudentStatus(
                                      en.studentId,
                                      ClubAttendanceStatus.EXCUSED,
                                    )
                                  }
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                                    status === ClubAttendanceStatus.EXCUSED
                                      ? 'bg-neutral-500 text-white shadow-xs'
                                      : 'text-neutral-500 hover:text-tertiary'
                                  }`}
                                >
                                  Sababli
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                type="text"
                                placeholder="Izoh..."
                                value={attendanceRemarks[en.studentId] || ''}
                                onChange={(e) =>
                                  setAttendanceRemarks((prev) => ({
                                    ...prev,
                                    [en.studentId]: e.target.value,
                                  }))
                                }
                                className="w-full px-2 py-1 text-xs bg-surface border border-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-border"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Moliya & To'lovlar */}
          {activeTab === 'billing' && (
            <div className="space-y-4">
              <div className="p-4 bg-muted-surface border border-border rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-tertiary">
                      To'garak to'lov turi:{' '}
                      {currentClub.feeType === ClubFeeType.PAID
                        ? "Pullik qo'shimcha kurs"
                        : "Bepul to'garak"}
                    </h4>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {currentClub.feeType === ClubFeeType.PAID
                        ? `Oylik abonent to'lovi: ${formatPrice(currentClub.monthlyFee)}`
                        : "Ushbu to'garak maktab shartnomasiga kiritilgan bo'lib, o'quvchilar uchun bepul tashkil etilgan."}
                    </p>
                  </div>
                  {currentClub.feeType === ClubFeeType.PAID && (
                    <div className="text-right">
                      <span className="text-xs text-neutral-400 block">
                        Kutilayotgan oylik tushum:
                      </span>
                      <span className="text-base font-bold text-tertiary tabular-nums">
                        {formatPrice(currentClub.monthlyFee * activeEnrollments.length)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {currentClub.feeType === ClubFeeType.PAID && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-tertiary">
                    A'zo o'quvchilar to'lov holati:
                  </h4>
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted-surface text-neutral-500 font-semibold border-b border-border">
                        <tr>
                          <th className="px-4 py-3">O'quvchi</th>
                          <th className="px-4 py-3">Sinfi</th>
                          <th className="px-4 py-3">Oylik to'lov</th>
                          <th className="px-4 py-3">Holat</th>
                          <th className="px-4 py-3 text-right">To'lov havolasi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {activeEnrollments.map((en) => (
                          <tr key={en.id} className="hover:bg-muted-surface transition-colors">
                            <td className="px-4 py-3 font-semibold text-tertiary">
                              {en.studentName}
                            </td>
                            <td className="px-4 py-3 text-neutral-500">
                              {en.className || `${en.gradeLevel}-sinf`}
                            </td>
                            <td className="px-4 py-3 font-medium tabular-nums">
                              {formatPrice(currentClub.monthlyFee)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#E8F7D0] text-success border border-success">
                                To'langan
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  alert(
                                    `Payme / Click to'lov havolasi yaratildi: ${en.studentName} (${formatPrice(currentClub.monthlyFee)})`,
                                  );
                                }}
                                className="px-2.5 py-1 text-xs font-medium text-secondary bg-muted-surface hover:bg-border border border-border rounded-lg transition-colors"
                              >
                                Havola olish
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
