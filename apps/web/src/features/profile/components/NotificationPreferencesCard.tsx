import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useUpdateNotificationPrefsMutation } from '../api/use-profile-mutations';

interface Props {
  initialPrefs?: Record<string, boolean>;
}

interface PreferenceDefinition {
  key: string;
  label: string;
  description: string;
}

const PREFERENCE_DEFINITIONS: PreferenceDefinition[] = [
  {
    key: 'telegramAttendance',
    label: 'Telegram davomat xabarlari',
    description:
      'Farzand darsga kelmaganida yoki kechikkanida darhol Telegram orqali bildirishnoma olish.',
  },
  {
    key: 'telegramGrades',
    label: 'Baholar va choraklik natijalar',
    description:
      "O'qituvchi yangi baho qo'yganda yoki chorak baholari e'lon qilinganda xabardor bo'lish.",
  },
  {
    key: 'telegramPayments',
    label: "To'lovlar va kvitansiyalar",
    description:
      "Hisob-fakturalar, to'lov muddati eslatmalari va tasdiqlangan to'lov kvitansiyalari.",
  },
  {
    key: 'emailAnnouncements',
    label: "Maktab yangiliklari va e'lonlar",
    description:
      "Muhim tadbirlar, bayramlar va ma'muriy e'lonlar haqida elektron pochta xabarlari.",
  },
];

export function NotificationPreferencesCard({ initialPrefs = {} }: Props): React.ReactElement {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    telegramAttendance: initialPrefs.telegramAttendance ?? true,
    telegramGrades: initialPrefs.telegramGrades ?? true,
    telegramPayments: initialPrefs.telegramPayments ?? true,
    emailAnnouncements: initialPrefs.emailAnnouncements ?? false,
    ...initialPrefs,
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const mutation = useUpdateNotificationPrefsMutation();

  const handleToggle = (key: string) => {
    setSaveSuccess(false);
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setSaveSuccess(false);
    try {
      await mutation.mutateAsync(prefs);
      setSaveSuccess(true);
    } catch {
      // error handled via mutation.error
    }
  };

  return (
    <Card className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border pb-3">
        <div>
          <h2 className="text-base font-semibold text-tertiary">Bildirishnoma sozlamalari</h2>
          <p className="text-xs sm:text-sm text-neutral-500">
            Qaysi kanallar va voqealar bo'yicha bildirishnomalar olishingizni tanlang.
          </p>
        </div>
        <Button type="button" size="sm" onClick={handleSave} isLoading={mutation.isPending}>
          Saqlash
        </Button>
      </div>

      {saveSuccess ? (
        <div
          role="status"
          className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 font-medium flex items-center gap-2"
        >
          <span className="font-semibold">Muvaffaqiyatli saqlandi:</span> Bildirishnoma sozlamalari
          yangilandi.
        </div>
      ) : null}

      {mutation.isError ? (
        <div
          role="alert"
          className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-400 font-medium"
        >
          {Array.isArray(mutation.error.message)
            ? mutation.error.message.join('; ')
            : mutation.error.message}
        </div>
      ) : null}

      <div className="divide-y divide-border">
        {PREFERENCE_DEFINITIONS.map((item) => {
          const isEnabled = Boolean(prefs[item.key]);
          return (
            <div
              key={item.key}
              className="py-3.5 flex items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-tertiary">{item.label}</span>
                  {isEnabled ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Faol
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-muted-surface text-neutral-400 border border-border">
                      O'chirilgan
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500">{item.description}</p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isEnabled}
                aria-label={item.label}
                onClick={() => handleToggle(item.key)}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <span
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    isEnabled ? 'bg-primary' : 'bg-slate-700'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
