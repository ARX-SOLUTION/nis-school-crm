import React, { useState } from 'react';
import type { NotificationTarget, SendBroadcastRequestDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { useClassesQuery } from '@/features/classes/api/use-classes-query';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SendBroadcastRequestDto) => Promise<void>;
  isSubmitting: boolean;
}

const TARGET_OPTIONS: { label: string; value: NotificationTarget }[] = [
  { label: 'Barcha ota-onalar', value: 'ALL_PARENTS' },
  { label: "Barcha o'qituvchilar", value: 'ALL_TEACHERS' },
  { label: 'Muayyan sinf ota-onalari', value: 'CLASS_PARENTS' },
  { label: 'Barcha foydalanuvchilar', value: 'ALL_USERS' },
];

export function SendBroadcastModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: Props): React.ReactElement {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<NotificationTarget>('ALL_PARENTS');
  const [classId, setClassId] = useState('');
  const [error, setError] = useState('');

  const { data: classesData } = useClassesQuery({ limit: 100 });
  const classes = classesData?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Iltimos, xabar sarlavhasini kiriting');
      return;
    }
    if (!message.trim()) {
      setError('Iltimos, xabar matnini kiriting');
      return;
    }
    if (target === 'CLASS_PARENTS' && !classId) {
      setError('Iltimos, sinfni tanlang');
      return;
    }
    setError('');

    try {
      await onSubmit({
        title: title.trim(),
        message: message.trim(),
        target,
        classId: target === 'CLASS_PARENTS' ? classId : undefined,
      });
      setTitle('');
      setMessage('');
      setTarget('ALL_PARENTS');
      setClassId('');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi';
      setError(msg);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Yangi ommaviy xabarnoma yuborish"
      description="Tanlangan qabul qiluvchilarga Telegram boti orqali tezkor bildirishnoma yuboriladi."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg"
          >
            {error}
          </div>
        )}

        <div>
          <label htmlFor="broadcast-title" className="block text-sm font-medium text-tertiary mb-1">
            Xabar sarlavhasi *
          </label>
          <input
            id="broadcast-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Masalan: Ota-onalar majlisi haqida"
            className="w-full min-h-[44px] px-3 py-2 text-sm text-tertiary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label
            htmlFor="broadcast-target"
            className="block text-sm font-medium text-tertiary mb-1"
          >
            Qabul qiluvchilar guruhi *
          </label>
          <select
            id="broadcast-target"
            value={target}
            onChange={(e) => {
              setTarget(e.target.value as NotificationTarget);
              if (e.target.value !== 'CLASS_PARENTS') setClassId('');
            }}
            className="w-full min-h-[44px] px-3 py-2 text-sm text-tertiary border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {TARGET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {target === 'CLASS_PARENTS' && (
          <div>
            <label
              htmlFor="broadcast-class"
              className="block text-sm font-medium text-tertiary mb-1"
            >
              Sinfni tanlang *
            </label>
            <select
              id="broadcast-class"
              required
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 text-sm text-tertiary border border-border rounded-lg bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">-- Sinfni tanlang --</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.academicYear})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label
            htmlFor="broadcast-message"
            className="block text-sm font-medium text-tertiary mb-1"
          >
            Xabar matni *
          </label>
          <textarea
            id="broadcast-message"
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Xabar tafsilotlarini kiriting..."
            className="w-full px-3 py-2 text-sm text-tertiary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 p-2.5 bg-[#DBEAFE] border border-secondary/20 rounded-lg text-xs text-secondary">
          <span className="font-semibold">Yetkazish kanali:</span>
          <span>Telegram Bot (Botga ulangan foydalanuvchilar oladi)</span>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-[44px] px-4"
          >
            Bekor qilish
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[44px] px-5 bg-primary hover:bg-primary text-tertiary font-medium shadow-sm"
          >
            {isSubmitting ? 'Yuborilmoqda...' : 'Xabarni yuborish'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
