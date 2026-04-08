import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import type { InventoryMovement } from "@fridge-inventory/shared";
import { inventoryRepository } from "../data/inventoryRepositorySingleton";
import { useInventory } from "../lib/useInventory";
import "../App.css";
import "./ItemDetailPage.css";

type FormDefaults = {
  itemId: string;
  type: "in" | "out";
  quantity: string;
  occurredAt: string;
  note: string;
};

function isoToDateInput(v?: string): string {
  if (!v) return new Date().toISOString().slice(0, 10);
  return v.slice(0, 10);
}

function defaultsFromMovement(
  movement: InventoryMovement | undefined,
  fallbackItemId: string,
  initialType: "in" | "out"
): FormDefaults {
  if (!movement) {
    return {
      itemId: fallbackItemId,
      type: initialType,
      quantity: "1",
      occurredAt: isoToDateInput(),
      note: "",
    };
  }
  return {
    itemId: movement.itemId,
    type: movement.type,
    quantity: String(movement.quantity),
    occurredAt: isoToDateInput(movement.occurredAt),
    note: movement.note ?? "",
  };
}

export default function MovementDetailPage() {
  const { movementId } = useParams<{ movementId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { items, movements, loading, refresh, setError, error } = useInventory();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isNew = movementId === "new";
  const existing = isNew ? undefined : movements.find((m) => m.id === movementId);
  const fallbackItemId = items[0]?.id ?? "";
  const requestedType = searchParams.get("type");
  const initialType: "in" | "out" = requestedType === "out" ? "out" : "in";
  const defaults = defaultsFromMovement(existing, fallbackItemId, initialType);

  const [itemId, setItemId] = useState(defaults.itemId);
  const [type, setType] = useState<"in" | "out">(defaults.type);
  const [quantity, setQuantity] = useState(defaults.quantity);
  const [occurredAt, setOccurredAt] = useState(defaults.occurredAt);
  const [note, setNote] = useState(defaults.note);

  if (!movementId) return <Navigate to="/movements" replace />;
  if (!isNew && loading) return <p className="muted page-pad">読み込み中…</p>;
  if (items.length === 0) {
    return (
      <div className="detail-page page-pad">
        <p className="banner banner-error">先に商品マスターを登録してください。</p>
        <Link to="/items/new" className="btn btn-primary detail-back">
          商品を追加
        </Link>
      </div>
    );
  }
  if (!isNew && !existing) return <Navigate to="/movements" replace />;

  const isBusy = saving || deleting;
  const canSubmit = itemId.length > 0 && !isBusy;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("数量は 1 以上の数で入力してください。");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await inventoryRepository.upsertMovement({
        id: isNew ? undefined : movementId,
        itemId,
        type,
        quantity: qty,
        occurredAt: new Date(`${occurredAt}T00:00:00.000Z`).toISOString(),
        note: note.trim() || undefined,
      });
      await refresh();
      navigate("/movements", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (isNew) return;
    setError(null);
    setDeleting(true);
    try {
      await inventoryRepository.removeMovement(movementId);
      await refresh();
      navigate("/movements", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました。");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="detail-page">
      <header className="detail-header">
        <button type="button" className="detail-backbtn" onClick={() => navigate(-1)} disabled={isBusy}>
          ← 戻る
        </button>
        <h1 className="detail-title">{isNew ? "入出庫を追加" : "入出庫を編集"}</h1>
      </header>

      <main className="main main--detail">
        {error ? <p className="banner banner-error page-pad-block">{error}</p> : null}
        <section className="card page-pad-block">
          <form id="movement-form" className="form" onSubmit={onSubmit}>
            <label className="field">
              <span className="label">商品</span>
              <select className="input" value={itemId} onChange={(e) => setItemId(e.target.value)} disabled={isBusy}>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="label">区分</span>
              <select
                className="input input-narrow"
                value={type}
                onChange={(e) => setType(e.target.value as "in" | "out")}
                disabled={isBusy}
              >
                <option value="in">入庫</option>
                <option value="out">出庫</option>
              </select>
            </label>
            <label className="field">
              <span className="label">数量</span>
              <input
                className="input input-narrow"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={isBusy}
              />
            </label>
            <label className="field">
              <span className="label">日付</span>
              <input
                className="input"
                type="date"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                disabled={isBusy}
              />
            </label>
            <label className="field">
              <span className="label">メモ（任意）</span>
              <textarea
                className="input textarea"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                disabled={isBusy}
              />
            </label>
          </form>
        </section>
      </main>

      <footer className="detail-footer">
        <button type="submit" form="movement-form" className="btn btn-primary" disabled={!canSubmit}>
          {saving ? "保存中…" : "保存"}
        </button>
        {!isNew ? (
          <button type="button" className="btn btn-danger" onClick={onDelete} disabled={isBusy}>
            {deleting ? "削除中…" : "削除"}
          </button>
        ) : null}
      </footer>
    </div>
  );
}
