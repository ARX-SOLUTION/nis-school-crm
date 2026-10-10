import React, { useEffect, useState } from 'react';
import { ClubCategory, ClubDto, ClubFeeType, ClubStatsDto } from '@nis/shared';
import { Plus, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-tertiary">
            Darsdan tashqari to'garaklar va doiralar
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Maktab o'quvchilarining qiziqishlari bo'yicha to'garaklar, murabbiylar, jadval va
            mustaqil davomat boshqaruvi
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsCreateOpen(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-1.5" />
          Yangi to'garak qo'shish
        </Button>
      </div>

      {/* Metrics Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card variant="metric" className="p-3 sm:p-4">
            <span className="text-xs font-medium text-slate-400 block">Jami to'garaklar</span>
            <div className="mt-1 text-2xl font-bold text-slate-100 tabular-nums">
              {stats.activeClubs}{' '}
              <span className="text-xs text-slate-400 font-normal">faol to'garak</span>
            </div>
          </Card>

          <Card variant="metric" className="p-3 sm:p-4">
            <span className="text-xs font-medium text-slate-400 block">
              Qamrab olingan o'quvchilar
            </span>
            <div className="mt-1 text-2xl font-bold text-blue-400 tabular-nums">
              {stats.totalEnrolled}{' '}
              <span className="text-xs text-slate-400 font-normal">nafar a'zo</span>
            </div>
          </Card>

          <Card variant="metric" className="p-3 sm:p-4">
            <span className="text-xs font-medium text-slate-400 block">Bugungi mashg'ulotlar</span>
            <div className="mt-1 text-2xl font-bold text-emerald-400 tabular-nums">
              {stats.todaySessionsCount}{' '}
              <span className="text-xs text-slate-400 font-normal">ta dars</span>
            </div>
          </Card>

          <Card variant="metric" className="p-3 sm:p-4">
            <span className="text-xs font-medium text-slate-400 block">O'rtacha qatnashish %</span>
            <div className="mt-1 text-2xl font-bold text-slate-100 tabular-nums">
              {stats.averageAttendanceRate}%{' '}
              <span className="text-xs text-slate-400 font-normal">davomat</span>
            </div>
          </Card>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            Barchasi
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory(ClubCategory.STEM_ROBOTICS)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
              selectedCategory === ClubCategory.STEM_ROBOTICS
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            STEM & Robototexnika
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory(ClubCategory.SPORTS)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
              selectedCategory === ClubCategory.SPORTS
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            Sport & Salomatlik
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory(ClubCategory.MUSIC_PERFORMING)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
              selectedCategory === ClubCategory.MUSIC_PERFORMING
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            Musiqa & Doira
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory(ClubCategory.ARTS_CRAFT)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
              selectedCategory === ClubCategory.ARTS_CRAFT
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            San'at & Hunarmandchilik
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory(ClubCategory.LANGUAGES)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
              selectedCategory === ClubCategory.LANGUAGES
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            Xorijiy Tillar
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory(ClubCategory.ACADEMIC_OLYMPIAD)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
              selectedCategory === ClubCategory.ACADEMIC_OLYMPIAD
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}
          >
            Olimpiada & Mantiq
          </button>
        </div>

        {/* Search & Fee filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-800">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="To'garak nomi yoki murabbiy F.I.Sh..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-hidden focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-medium text-slate-400 whitespace-nowrap">To'lov:</span>
            <select
              value={selectedFeeType}
              onChange={(e) => setSelectedFeeType(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded-lg focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">Barcha to'garaklar</option>
              <option value={ClubFeeType.FREE}>Faqat bepul</option>
              <option value={ClubFeeType.PAID}>Faqat pullik</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Clubs Grid */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-400">
          To'garaklar ro'yxati yuklanmoqda...
        </div>
      ) : error ? (
        <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300">
          {error}
        </div>
      ) : filteredClubs.length === 0 ? (
        <Card className="py-20 text-center p-8">
          <p className="text-base font-semibold text-slate-100 mb-1">Mos to'garaklar topilmadi</p>
          <p className="text-xs text-slate-400 mb-4">
            Filtr parametrlarini o'zgartiring yoki yangi to'garak qo'shing
          </p>
          <Button variant="primary" onClick={() => setIsCreateOpen(true)} className="mx-auto">
            Yangi to'garak yaratish
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5">
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
