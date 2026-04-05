const SESSION_KEY = "fridge-auth-session";

export function isAuthenticated(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export function setAuthenticated(): void {
  sessionStorage.setItem(SESSION_KEY, "1");
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
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
