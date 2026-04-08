import { useRef, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import type { InventoryItem } from "@fridge-inventory/shared";
import {
  DEFAULT_HOUSEHOLD_ID,
  LOCATION_FRIDGE,
} from "../constants/storage";
import { inventoryRepository } from "../data/inventoryRepositorySingleton";
import { uploadImageToDrive } from "../data/sheetsInventoryRepository";
import { formatDateJa } from "../lib/formatDate";
import { useInventory } from "../lib/useInventory";
import "../App.css";
import "./ItemDetailPage.css";

const sheetsApiUrl = import.meta.env.VITE_SHEETS_API_URL as string | undefined;

type FormDefaults = {
  category: string;
  imageUrl: string;
  name: string;
  note: string;
};

function emptyDefaults(): FormDefaults {
  return {
    category: "",
    imageUrl: "",
    name: "",
    note: "",
  };
}

function defaultsFromItem(item: InventoryItem): FormDefaults {
  return {
    category: item.category ?? "",
    imageUrl: item.imageUrl ?? "",
    name: item.name,
    note: item.note ?? "",
  };
}

function ItemDetailForm({
  defaults,
  isNew,
  itemId,
  existing,
}: {
  defaults: FormDefaults;
  isNew: boolean;
  itemId: string;
  existing: InventoryItem | undefined;
}) {
  const navigate = useNavigate();
  const { refresh, setError, error } = useInventory();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [category, setCategory] = useState(defaults.category);
  const [imageUrl, setImageUrl] = useState(defaults.imageUrl);
  const [name, setName] = useState(defaults.name);
  const [note, setNote] = useState(defaults.note);

  const isBusy = uploading || saving || deleting;
  const canSubmit = name.trim().length > 0 && !isBusy;

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sheetsApiUrl) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImageToDrive(sheetsApiUrl, file);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "画像アップロードに失敗しました");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSaving(true);
    try {
      await inventoryRepository.upsert({
        id: isNew ? undefined : itemId,
        householdId: existing?.householdId ?? DEFAULT_HOUSEHOLD_ID,
        locationId: existing?.locationId ?? LOCATION_FRIDGE,
        category: category.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        name: name.trim(),
        quantity: 0,
        note: note.trim() || undefined,
        source: "manual",
      });
      await refresh();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (isNew) return;
    setShowDeleteModal(false);
    setError(null);
    setDeleting(true);
    try {
      await inventoryRepository.remove(itemId);
      await refresh();
      navigate("/", { replace: true, state: { flashMessage: "削除しました。" } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました。");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="detail-page">
      <header className="detail-header">
        <button
          type="button"
          className="detail-backbtn"
          onClick={() => navigate(-1)}
          disabled={isBusy}
        >
          ← 戻る
        </button>
        <h1 className="detail-title">
          {isNew ? "商品マスター登録" : "商品マスター"}
        </h1>
      </header>

      <main className="main main--detail">
        {error ? (
          <p className="banner banner-error page-pad-block">{error}</p>
        ) : null}
        {!isNew && existing ? (
          <div className="detail-summary card page-pad-block">
            <p className="detail-summary__label">商品マスター</p>
            <p className="detail-summary__category">
              {existing.category?.trim()
                ? existing.category.trim()
                : "未分類"}
            </p>
            <p className="detail-summary__name">{existing.name}</p>
            <p className="detail-summary__meta">
              更新日 {formatDateJa(existing.updatedAt)}
            </p>
          </div>
        ) : null}

        <section className="card page-pad-block">
          <form id="item-form" className="form" onSubmit={onSubmit}>
            <label className="field">
              <span className="label">カテゴリ（任意）</span>
              <input
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="例：野菜、飲料"
                autoComplete="off"
                disabled={isBusy}
              />
            </label>
            <div className="field">
              <span className="label">画像（任意）</span>
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="プレビュー"
                  style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, marginBottom: 6 }}
                />
              )}
              {sheetsApiUrl ? (
                <label className="field" style={{ gap: 4 }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="input"
                    onChange={onFileChange}
                    disabled={isBusy}
                  />
                  {uploading && <span className="muted" style={{ fontSize: "0.85em" }}>アップロード中…</span>}
                </label>
              ) : (
                <input
                  className="input"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://…"
                  inputMode="url"
                  autoComplete="off"
                  disabled={isBusy}
                />
              )}
            </div>
            <label className="field">
              <span className="label">名前</span>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：牛乳"
                autoComplete="off"
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
        <button
          type="submit"
          form="item-form"
          className="btn btn-primary"
          disabled={!canSubmit}
        >
          {saving ? "保存中…" : "保存"}
        </button>
        {!isNew ? (
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setShowDeleteModal(true)}
            disabled={isBusy}
          >
            {deleting ? "削除中…" : "削除"}
          </button>
        ) : null}
      </footer>
      {showDeleteModal ? (
        <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-label="削除確認">
          <div className="card dialog-card">
            <p className="card-title">削除してもよろしいですか？</p>
            <p className="muted">この操作は取り消せません。</p>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={onDelete}
                disabled={deleting}
              >
                {deleting ? "削除中…" : "削除する"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const { items, loading } = useInventory();

  const isNew = itemId === "new";
  const existing =
    !itemId || isNew ? undefined : items.find((i) => i.id === itemId);

  if (!itemId) {
    return <Navigate to="/" replace />;
  }

  if (!isNew && loading) {
    return (
      <div className="detail-page page-pad">
        <p className="muted">読み込み中…</p>
      </div>
    );
  }

  if (!isNew && !loading && !existing) {
    return (
      <div className="detail-page page-pad">
        <p className="banner banner-error">商品が見つかりません。</p>
        <Link to="/" className="btn btn-ghost detail-back">
          冷蔵庫に戻る
        </Link>
      </div>
    );
  }

  const defaults = isNew
    ? emptyDefaults()
    : existing
      ? defaultsFromItem(existing)
      : emptyDefaults();

  const formKey = isNew ? "new" : (existing?.id ?? itemId);

  return (
    <ItemDetailForm
      key={formKey}
      defaults={defaults}
      isNew={isNew}
      itemId={itemId}
      existing={existing}
    />
  );
}
