import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { InventoryItem, InventoryMovement } from "@fridge-inventory/shared";
import { clearSession } from "../auth/session";
import { LOCATION_FRIDGE } from "../constants/storage";
import { useInventory } from "../lib/useInventory";
import "../App.css";
import "./CollectionPage.css";

function isFridgeItem(locationId?: string): boolean {
  return locationId === undefined || locationId === LOCATION_FRIDGE;
}

function inventoryAmount(item: InventoryItem, balanceMap: Map<string, number>): number {
  return balanceMap.get(item.id) ?? 0;
}

type StockBucket = {
  expiresAt?: string;
  quantity: number;
};

function bucketSortValue(expiresAt?: string): number {
  if (!expiresAt) return Number.POSITIVE_INFINITY;
  const ts = new Date(expiresAt).getTime();
  return Number.isNaN(ts) ? Number.POSITIVE_INFINITY : ts;
}

function sortBuckets(a: StockBucket, b: StockBucket): number {
  const diff = bucketSortValue(a.expiresAt) - bucketSortValue(b.expiresAt);
  if (diff !== 0) return diff;
  return (a.expiresAt ?? "").localeCompare(b.expiresAt ?? "");
}

function buildStockBuckets(movements: InventoryMovement[]): Map<string, StockBucket[]> {
  const ordered = [...movements].sort((a, b) => {
    const diff = new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
    if (diff !== 0) return diff;
    if (a.type === b.type) return 0;
    return a.type === "in" ? -1 : 1;
  });
  const bucketMap = new Map<string, StockBucket[]>();
  for (const movement of ordered) {
    const buckets = bucketMap.get(movement.itemId) ?? [];
    if (movement.type === "in") {
      const expiresAt = movement.expiresAt?.trim() || undefined;
      const existing = buckets.find((b) => (b.expiresAt ?? "") === (expiresAt ?? ""));
      if (existing) {
        existing.quantity += movement.quantity;
      } else {
        buckets.push({ expiresAt, quantity: movement.quantity });
      }
      buckets.sort(sortBuckets);
      bucketMap.set(movement.itemId, buckets);
      continue;
    }
    let remaining = movement.quantity;
    buckets.sort(sortBuckets);
    for (const bucket of buckets) {
      if (remaining <= 0) break;
      const consumed = Math.min(bucket.quantity, remaining);
      bucket.quantity -= consumed;
      remaining -= consumed;
    }
    const positiveBuckets = buckets.filter((b) => b.quantity > 0).sort(sortBuckets);
    bucketMap.set(movement.itemId, positiveBuckets);
  }
  return bucketMap;
}

function formatExpiryLabel(expiresAt?: string): string {
  if (!expiresAt) return "賞味期限未登録";
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return expiresAt;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}/${m}/${d}`;
}

function categoryLabel(item: InventoryItem): string {
  const c = item.category?.trim();
  return c && c.length > 0 ? c : "未分類";
}

export default function CollectionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, movements, loading, error, refresh } = useInventory();
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const msg = (location.state as { flashMessage?: string } | null)?.flashMessage;
    if (!msg) return;
    setFlashMessage(msg);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const fridgeItems = items.filter((i) => isFridgeItem(i.locationId));
  const stockBucketMap = buildStockBuckets(movements);
  const balanceMap = new Map<string, number>(
    [...stockBucketMap.entries()].map(([itemId, buckets]) => [
      itemId,
      buckets.reduce((sum, bucket) => sum + bucket.quantity, 0),
    ])
  );
  const classifiedItems = fridgeItems
    .map((item) => {
      const amount = inventoryAmount(item, balanceMap);
      const isOutOfStock = amount <= 0;
      const isRoutine = item.isRoutine === true;
      return {
        item,
        amount,
        buckets: stockBucketMap.get(item.id) ?? [],
        isRoutine,
        isDisabled: isOutOfStock && !isRoutine,
      };
    })
    .sort((a, b) => a.item.name.localeCompare(b.item.name, "ja"));
  const activeItems = classifiedItems.filter((x) => !x.isDisabled);
  const disabledItems = classifiedItems.filter((x) => x.isDisabled);

  const onLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  const onRefreshClick = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <header className="page-header">
        <div className="page-header__row">
          <div>
            <h1 className="page-title">冷蔵庫</h1>
            <p className="page-sub">ギャラリー</p>
          </div>
          <div className="page-header__actions">
            <button
              type="button"
              className="btn-icon"
              onClick={onRefreshClick}
              aria-label={refreshing ? "更新中" : "更新"}
              disabled={loading || refreshing}
            >
              <svg
                className={refreshing ? "btn-icon__spinner" : undefined}
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path d="M4 12a8 8 0 0 1 14.93-4H16a1 1 0 1 0 0 2h5a1 1 0 0 0 1-1V4a1 1 0 1 0-2 0v2.36A10 10 0 1 0 22 12a1 1 0 1 0-2 0 8 8 0 0 1-16 0Z" fill="currentColor"/>
              </svg>
            </button>
            {refreshing ? (
              <span className="page-header__status" role="status" aria-live="polite">
                更新中…
              </span>
            ) : null}
            <button
              type="button"
              className="btn-text"
              onClick={onLogout}
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="main main--flush">
        {flashMessage ? (
          <p className="banner banner-success">{flashMessage}</p>
        ) : null}
        {error ? (
          <p className="banner banner-error">{error}</p>
        ) : null}

        {loading ? (
          <p className="muted page-pad">読み込み中…</p>
        ) : classifiedItems.length === 0 ? (
          <div className="page-pad empty-state card">
            <p className="muted empty-state__text">
              冷蔵庫の在庫はまだありません。
            </p>
            <Link to="/items/new" className="btn btn-primary empty-state__cta">
              商品を追加
            </Link>
          </div>
        ) : (
          <div className="stock-sections page-pad">
            <section>
              <h2 className="stock-section-title">在庫あり</h2>
              <ul className="gallery-grid">
                {activeItems.map(({ item, amount, buckets, isRoutine }) => (
                  <li key={item.id} className="gallery-grid__cell">
                    <Link className="gallery-card" to={`/items/${item.id}`}>
                  <div className="gallery-card__media">
                    {item.imageUrl?.trim() ? (
                      <img
                        className="gallery-card__img"
                        src={item.imageUrl.trim()}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="gallery-card__placeholder"
                        aria-hidden
                      >
                        <span className="gallery-card__placeholder-char">
                          {item.name.trim().slice(0, 1) || "?"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="gallery-card__body">
                    <div className="gallery-card__meta-row">
                      <p
                        className={`gallery-card__category ${
                          item.category?.trim()
                            ? ""
                            : "gallery-card__category--muted"
                        }`}
                      >
                        {categoryLabel(item)}
                      </p>
                    </div>
                    <p className="gallery-card__name">{item.name}</p>
                    {buckets.length > 0 ? (
                      <ul className="gallery-card__stock-by-expiry">
                        {buckets.map((bucket) => (
                          <li key={`${item.id}:${bucket.expiresAt ?? "none"}`}>
                            {bucket.expiresAt
                              ? `${bucket.quantity}個（${formatExpiryLabel(bucket.expiresAt)}）`
                              : `${bucket.quantity}個`}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {disabledItems.length > 0 ? (
              <section className="stock-section stock-section--out">
                <h2 className="stock-section-title stock-section-title--muted">在庫切れ</h2>
                <ul className="gallery-grid">
                  {disabledItems.map(({ item, amount }) => (
                    <li key={item.id} className="gallery-grid__cell">
                      <Link
                        className="gallery-card gallery-card--disabled"
                        to="#"
                        onClick={(e) => e.preventDefault()}
                        aria-disabled
                        tabIndex={-1}
                      >
                        <div className="gallery-card__media">
                          {item.imageUrl?.trim() ? (
                            <img className="gallery-card__img" src={item.imageUrl.trim()} alt="" loading="lazy" />
                          ) : (
                            <div className="gallery-card__placeholder" aria-hidden>
                              <span className="gallery-card__placeholder-char">
                                {item.name.trim().slice(0, 1) || "?"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="gallery-card__body">
                          <p
                            className={`gallery-card__category ${
                              item.category?.trim() ? "" : "gallery-card__category--muted"
                            }`}
                          >
                            {categoryLabel(item)}
                          </p>
                          <p className="gallery-card__name">{item.name}</p>
                          <p className="gallery-card__amount">{`×${amount}`}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </main>

      {!loading && fridgeItems.length > 0 ? (
        <Link to="/items/new" className="fab" aria-label="商品を追加">
          <span className="fab__icon" aria-hidden>
            +
          </span>
        </Link>
      ) : null}
    </>
  );
}
