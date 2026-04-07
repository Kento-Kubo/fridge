const SESSION_KEY = "fridge-auth-session";

function getSessionStorageSafe(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  const storage = getSessionStorageSafe();
  if (!storage) return false;
  try {
    return storage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAuthenticated(): void {
  const storage = getSessionStorageSafe();
  if (!storage) return;
  try {
    storage.setItem(SESSION_KEY, "1");
  } catch {
    // sessionStorage が使えない環境ではセッション保持をスキップ
  }
}

export function clearSession(): void {
  const storage = getSessionStorageSafe();
  if (!storage) return;
  try {
    storage.removeItem(SESSION_KEY);
  } catch {
    // no-op
  }
}

/** 本番では VITE_APP_PASSWORD を必ず設定。未設定時は開発のみ "dev" でログイン可 */
export function getConfiguredPassword(): string | null {
  const fromEnv = import.meta.env.VITE_APP_PASSWORD;
  if (typeof fromEnv === "string" && fromEnv.length > 0) {
    return fromEnv;
  }
  if (import.meta.env.DEV) {
    return "dev";
  }
  return null;
}

export function tryLogin(password: string): boolean {
  const expected = getConfiguredPassword();
  if (expected === null) {
    return false;
  }
  return password === expected;
}
