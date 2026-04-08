import { useState } from "react";
import type { TransactionType } from "@fridge-inventory/shared";
import { useTransaction } from "../lib/useTransaction";
import { useInventory } from "../lib/useInventory";
import "../App.css";
import "./CollectionPage.css";
import "./TransactionPage.css";

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type FormState = {
  type: TransactionType;
  itemName: string;
  quantity: string;
  note: string;
};

const INITIAL_FORM: FormState = {
  type: "in",
  itemName: "",
  quantity: "1",
  note: "",
};

export default function TransactionPage() {
  const { records, loading, error, refresh, addRecord } = useTransaction();
  const { items } = useInventory();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fridgeItemNames = Array.from(new Set(items.map((i) => i.name).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b, "ja")
  );

  const handleOpen = (type: TransactionType) => {
    setForm({ ...INITIAL_FORM, type });
    setFormError(null);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(form.quantity);
    if (!form.itemName.trim()) {
      setFormError("商品名を入力してください。");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setFormError("数量は1以上の数値を入力してください。");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await addRecord({
        itemName: form.itemName.trim(),
        type: form.type,
        quantity: qty,
        note: form.note.trim() || undefined,
      });
      setShowForm(false);
    } catch {
      setFormError("登録に失敗しました。再度お試しください。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="page-header">
        <div className="page-header__row">
          <div>
            <h1 className="page-title">入出庫</h1>
            <p className="page-sub">履歴</p>
          </div>
          <div className="page-header__actions">
            <button
              type="button"
              className="btn-icon"
              onClick={() => refresh()}
              aria-label="更新"
              disabled={loading}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M4 12a8 8 0 0 1 14.93-4H16a1 1 0 1 0 0 2h5a1 1 0 0 0 1-1V4a1 1 0 1 0-2 0v2.36A10 10 0 1 0 22 12a1 1 0 1 0-2 0 8 8 0 0 1-16 0Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="main main--flush">
        {error ? <p className="banner banner-error">{error}</p> : null}

        {/* 入庫・出庫ボタン */}
        <div className="tx-actions page-pad">
          <button
            type="button"
            className="btn tx-btn tx-btn--in"
            onClick={() => handleOpen("in")}
          >
            <span className="tx-btn__icon" aria-hidden>↓</span>
            入庫
          </button>
          <button
            type="button"
            className="btn tx-btn tx-btn--out"
            onClick={() => handleOpen("out")}
          >
            <span className="tx-btn__icon" aria-hidden>↑</span>
            出庫
          </button>
        </div>

        {/* 履歴リスト */}
        {loading ? (
          <p className="muted page-pad">読み込み中…</p>
        ) : records.length === 0 ? (
          <div className="page-pad">
            <p className="muted">入出庫の記録はまだありません。</p>
          </div>
        ) : (
          <ul className="list tx-list page-pad">
            {records.map((r) => (
              <li key={r.id} className="list-item tx-item">
                <div className="tx-item__main">
                  <span className={`tx-badge tx-badge--${r.type}`}>
                    {r.type === "in" ? "入庫" : "出庫"}
                  </span>
                  <span className="list-name tx-item__name">{r.itemName}</span>
                  <span className="list-qty tx-item__qty">×{r.quantity}</span>
                </div>
                <div className="list-meta">
                  <span>{formatDateTime(r.recordedAt)}</span>
                  {r.note ? <span className="list-note">{r.note}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* 登録フォームダイアログ */}
      {showForm ? (
        <div className="dialog-backdrop" onClick={handleClose}>
          <div className="card dialog-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="card-title">
              {form.type === "in" ? "入庫を登録" : "出庫を登録"}
            </h2>
            <form className="form" onSubmit={handleSubmit}>
              {formError ? (
                <p className="banner banner-error">{formError}</p>
              ) : null}

              {/* 入庫/出庫 切り替え */}
              <div className="field">
                <span className="label">種別</span>
                <div className="tx-type-toggle">
                  <button
                    type="button"
                    className={`tx-type-btn${form.type === "in" ? " tx-type-btn--active-in" : ""}`}
                    onClick={() => setForm((f) => ({ ...f, type: "in" }))}
                  >
                    ↓ 入庫
                  </button>
                  <button
                    type="button"
                    className={`tx-type-btn${form.type === "out" ? " tx-type-btn--active-out" : ""}`}
                    onClick={() => setForm((f) => ({ ...f, type: "out" }))}
                  >
                    ↑ 出庫
                  </button>
                </div>
              </div>

              {/* 商品名 */}
              <div className="field">
                <label className="label" htmlFor="tx-item-name">商品名</label>
                <input
                  id="tx-item-name"
                  className="input"
                  type="text"
                  list="tx-item-suggestions"
                  placeholder="例: 牛乳"
                  value={form.itemName}
                  onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))}
                  autoComplete="off"
                  required
                />
                <datalist id="tx-item-suggestions">
                  {fridgeItemNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              {/* 数量 */}
              <div className="field">
                <label className="label" htmlFor="tx-quantity">数量</label>
                <input
                  id="tx-quantity"
                  className="input input-narrow"
                  type="number"
                  min="1"
                  step="1"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  required
                />
              </div>

              {/* メモ */}
              <div className="field">
                <label className="label" htmlFor="tx-note">メモ（任意）</label>
                <input
                  id="tx-note"
                  className="input"
                  type="text"
                  placeholder="例: 賞味期限間近"
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleClose}
                  disabled={saving}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className={`btn ${form.type === "in" ? "tx-submit--in" : "tx-submit--out"}`}
                  disabled={saving}
                >
                  {saving ? "登録中…" : "登録する"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
