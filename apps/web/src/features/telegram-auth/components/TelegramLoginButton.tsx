import { useEffect, useRef } from 'react';
import type { TelegramAuthRequestDto } from '@nis/shared';
import { DevPayloadInput } from './DevPayloadInput';

// Ambient extension of Window — no `any`, strictly typed.
declare global {
  interface Window {
    onTelegramAuth: ((user: TelegramAuthRequestDto) => void) | undefined;
  }
}

export interface TelegramLoginButtonProps {
  botUsername: string;
  onAuth: (payload: TelegramAuthRequestDto) => void;
}

export function TelegramLoginButton({
  botUsername,
  onAuth,
}: TelegramLoginButtonProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Register the callback the widget will invoke.
    window.onTelegramAuth = (user: TelegramAuthRequestDto) => {
      onAuth(user);
    };

    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-userpic', 'true');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    container.appendChild(script);

    return () => {
      container.removeChild(script);
      window.onTelegramAuth = undefined;
    };
  }, [botUsername, onAuth]);

  return <div ref={containerRef} />;
}

// ---------------------------------------------------------------------------
// Public-facing component that chooses real widget vs dev fallback.
// ---------------------------------------------------------------------------

export interface TelegramLoginProps {
  onAuth: (payload: TelegramAuthRequestDto) => void;
}

export function TelegramLogin({ onAuth }: TelegramLoginProps): React.ReactElement {
  const botUsername: string | undefined = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || undefined;

  if (!botUsername) {
    return <DevPayloadInput onAuth={onAuth} />;
  }

  return <TelegramLoginButton botUsername={botUsername} onAuth={onAuth} />;
}
