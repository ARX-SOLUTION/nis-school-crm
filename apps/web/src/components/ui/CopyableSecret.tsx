import { useState } from 'react';
import { Button } from './Button';

interface Props {
  value: string;
  label?: string;
}

/**
 * Display a one-time secret (e.g., a generated password) with a copy-to-
 * clipboard affordance. Reduces delivery-typo risk vs. requiring the admin
 * to select-and-copy from a <pre>.
 */
export function CopyableSecret({ value, label = 'Copy' }: Props): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be denied (e.g., non-HTTPS dev); leave the <pre>
      // visible so the admin can still select manually.
    }
  };

  return (
    <div className="flex items-stretch gap-2">
      <pre className="flex-1 overflow-x-auto rounded-md bg-slate-900 px-3 py-2 text-sm text-white">
        {value}
      </pre>
      <Button type="button" variant="secondary" size="sm" onClick={copy}>
        {copied ? 'Copied' : label}
      </Button>
    </div>
  );
}
