import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  getConfiguredPassword,
  isAuthenticated,
  setAuthenticated,
  tryLogin,
} from "../auth/session";
import "../App.css";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from && (location.state as { from: string }).from !== "/login"
      ? (location.state as { from: string }).from
      : "/";

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const missingConfig = getConfiguredPassword() === null;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (missingConfig) {
      setError(
        "本番用パスワードが未設定です。ホスティングの環境変数 VITE_APP_PASSWORD を設定してください。"
      );
      return;
    }
    if (!tryLogin(password)) {
      setError("パスワードが違います。");
      return;
    }
    setAuthenticated();
    navigate(from, { replace: true });
  };

  return (
    <div className="login-page">
      <div className="login-card card">
        <h1 className="login-title">Fridge 在庫</h1>
        <p className="login-lead">パスワードでログイン</p>
        {import.meta.env.DEV && !import.meta.env.VITE_APP_PASSWORD ? (
          <p className="login-hint">
            開発中: パスワードは <strong>dev</strong> です（.env で変更可）
          </p>
        ) : null}
        <form className="form" onSubmit={onSubmit}>
          <label className="field">
            <span className="label">パスワード</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              enterKeyHint="go"
            />
          </label>
          {error ? <p className="banner banner-error login-error">{error}</p> : null}
          <button type="submit" className="btn btn-primary login-submit">
            ログイン
          </button>
        </form>
      </div>
    </div>
  );
}
