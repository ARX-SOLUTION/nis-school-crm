import { useState } from 'react';
import type { TelegramAuthRequestDto } from '@nis/shared';
import { Button } from '@/components/ui/Button';

export interface DevPayloadInputProps {
  onAuth: (payload: TelegramAuthRequestDto) => void;
}

export function DevPayloadInput({ onAuth }: DevPayloadInputProps): React.ReactElement {
  const [text, setText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  function handleSubmit(): void {
    setParseError(null);
    try {
      const parsed: unknown = JSON.parse(text);
      // Minimal structural check before casting — keeps TypeScript strict
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        typeof (parsed as Record<string, unknown>)['id'] !== 'number' ||
        typeof (parsed as Record<string, unknown>)['auth_date'] !== 'number' ||
        typeof (parsed as Record<string, unknown>)['hash'] !== 'string' ||
        typeof (parsed as Record<string, unknown>)['first_name'] !== 'string'
      ) {
        setParseError('JSON must include id (number), first_name, auth_date (number), hash.');
        return;
      }
      onAuth(parsed as TelegramAuthRequestDto);
    } catch {
      setParseError('Invalid JSON — paste the raw Telegram widget payload object.');
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
        DEV FALLBACK — VITE_TELEGRAM_BOT_USERNAME is not set. Paste a pre-signed Telegram auth
        payload below to test the backend flow.
      </p>
      <label htmlFor="dev-payload" className="block text-sm font-medium text-slate-700">
        Telegram auth payload (JSON)
      </label>
      <textarea
        id="dev-payload"
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='{"id":123456,"first_name":"Test","auth_date":1700000000,"hash":"abc..."}'
        aria-describedby={parseError ? 'dev-payload-error' : undefined}
        aria-invalid={parseError !== null || undefined}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono
          placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600
          aria-[invalid=true]:border-red-400"
      />
      {parseError ? (
        <p id="dev-payload-error" role="alert" className="text-sm text-red-600">
          {parseError}
        </p>
      ) : null}
      <Button type="button" onClick={handleSubmit} className="w-full">
        Submit payload
      </Button>
    </div>
  );
}
