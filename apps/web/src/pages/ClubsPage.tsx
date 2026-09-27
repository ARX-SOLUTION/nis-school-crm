import React, { useEffect, useState } from 'react';
import { ClubCategory, ClubDto, ClubFeeType, ClubStatsDto } from '@nis/shared';
import { clubsApi } from '../features/clubs/api/clubs-api';
import { ClubCard } from '../features/clubs/components/ClubCard';
import { ClubDetailsModal } from '../features/clubs/components/ClubDetailsModal';
import { EnrollStudentModal } from '../features/clubs/components/EnrollStudentModal';
import { CreateClubModal } from '../features/clubs/components/CreateClubModal';

export const ClubsPage: React.FC = () => {
  const [clubs, setClubs] = useState<ClubDto[]>([]);
  const [stats, setStats] = useState<ClubStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedFeeType, setSelectedFeeType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [selectedClub, setSelectedClub] = useState<ClubDto | null>(null);
  const [enrollClub, setEnrollClub] = useState<ClubDto | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [clubsData, statsData] = await Promise.all([clubsApi.list(), clubsApi.getStats()]);
      setClubs(clubsData);
      setStats(statsData);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(msg || "To'garaklar ma'lumotlarini yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const filteredClubs = clubs.filter((c) => {
    if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
    if (selectedFeeType !== 'ALL' && c.feeType !== selectedFeeType) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = c.name.toLowerCase().includes(term);
      const matchInstructor = (c.instructorName || '').toLowerCase().includes(term);
      if (!matchName && !matchInstructor) return false;
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Darsdan tashqari to'garaklar va doiralar
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Maktab o'quvchilarining qiziqishlari bo'yicha to'garaklar, murabbiylar, jadval va
            mustaqil davomat boshqaruvi
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2.5 text-xs font-semibold rounded-xl text-white bg-slate-900 hover:bg-slate-800 shadow-xs transition-colors shrink-0"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Yangi to'garak qo'shish
        </button>
      </div>

      {/* Metrics Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-medium text-slate-500 block">Jami to'garaklar:</span>
            <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
              {stats.activeClubs}{' '}
              <span className="text-xs text-slate-400 font-normal">faol to'garak</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-medium text-slate-500 block">
              Qamrab olingan o'quvchilar:
            </span>
            <div className="mt-1 text-2xl font-bold text-indigo-600 tabular-nums">
              {stats.totalEnrolled}{' '}
              <span className="text-xs text-slate-400 font-normal">nafar a'zo</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-medium text-slate-500 block">Bugungi mashg'ulotlar:</span>
            <div className="mt-1 text-2xl font-bold text-emerald-600 tabular-nums">
              {stats.todaySessionsCount}{' '}
              <span className="text-xs text-slate-400 font-normal">ta dars</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-xs font-medium text-slate-500 block">O'rtacha qatnashish %:</span>
            <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">
              {stats.averageAttendanceRate}%{' '}
              <span className="text-xs text-slate-400 font-normal">davomat</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Barchasi
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory(ClubCategory.STEM_ROBOTICS)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
              selectedCategory === ClubCategory.STEM_ROBOTICS
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            STEM & Robototexnika
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory(ClubCategory.SPORTS)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
              selectedCategory === ClubCategory.SPORTS
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Sport & Salomatlik
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory(ClubCategory.MUSIC_PERFORMING)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
              selectedCategory === ClubCategory.MUSIC_PERFORMING
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Musiqa & Doira
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory(ClubCategory.ARTS_CRAFT)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
              selectedCategory === ClubCategory.ARTS_CRAFT
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            San'at & Hunarmandchilik
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory(ClubCategory.LANGUAGES)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
              selectedCategory === ClubCategory.LANGUAGES
                ? 'bg-sky-600 text-white'
                : 'bg-sky-50 text-sky-700 hover:bg-sky-100'
            }`}
          >
            Xorijiy Tillar
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory(ClubCategory.ACADEMIC_OLYMPIAD)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
              selectedCategory === ClubCategory.ACADEMIC_OLYMPIAD
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            Olimpiada & Mantiq
          </button>
        </div>

        {/* Search & Fee filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="To'garak nomi yoki murabbiy F.I.Sh..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">To'lov:</span>
            <select
              value={selectedFeeType}
              onChange={(e) => setSelectedFeeType(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            >
              <option value="ALL">Barcha to'garaklar</option>
              <option value={ClubFeeType.FREE}>Faqat bepul</option>
              <option value={ClubFeeType.PAID}>Faqat pullik</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clubs Grid */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-400">
          To'garaklar ro'yxati yuklanmoqda...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
          {error}
        </div>
      ) : filteredClubs.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <p className="text-base font-semibold text-slate-800 mb-1">Mos to'garaklar topilmadi</p>
          <p className="text-xs text-slate-400 mb-4">
            Filtr parametrlarini o'zgartiring yoki yangi to'garak qo'shing
          </p>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-white bg-slate-900 hover:bg-slate-800 transition-colors"
          >
            Yangi to'garak yaratish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClubs.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              onSelect={(c) => setSelectedClub(c)}
              onEnrollClick={(c) => setEnrollClub(c)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {selectedClub && (
        <ClubDetailsModal
          club={selectedClub}
          isOpen={Boolean(selectedClub)}
          onClose={() => setSelectedClub(null)}
          onEnrollClick={(c) => {
            setSelectedClub(null);
            setEnrollClub(c);
          }}
          onRefresh={loadData}
        />
      )}

      {enrollClub && (
        <EnrollStudentModal
          club={enrollClub}
          isOpen={Boolean(enrollClub)}
          onClose={() => setEnrollClub(null)}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {isCreateOpen && (
        <CreateClubModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};
