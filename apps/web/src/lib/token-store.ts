/**
 * Minimal token store with pub-sub. The access token lives only in memory
 * (never localStorage — an XSS exfil would drain it). The refresh token
 * is stored in sessionStorage so a tab reload can reauth without losing
 * the session, but a closed tab clears it.
 */

const SESSION_KEY = 'nis.refresh';

type Listener = () => void;

interface TokenState {
  accessToken: string | null;
  refreshToken: string | null;
}

class TokenStore {
  private accessToken: string | null = null;
  private readonly listeners = new Set<Listener>();

  getAccess(): string | null {
    return this.accessToken;
  }

  getRefresh(): string | null {
    try {
      return sessionStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  }

  getSnapshot(): TokenState {
    return { accessToken: this.accessToken, refreshToken: this.getRefresh() };
  }

  setTokens(access: string, refresh: string): void {
    this.accessToken = access;
    try {
      sessionStorage.setItem(SESSION_KEY, refresh);
    } catch {
      /* storage may be disabled; continue with in-memory access only */
    }
    this.notify();
  }

  clear(): void {
    this.accessToken = null;
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
    this.notify();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    for (const l of this.listeners) l();
  }
}

export const tokenStore = new TokenStore();
