import { Link, useNavigate } from "react-router-dom";
import type { InventoryItem } from "@fridge-inventory/shared";
import { clearSession } from "../auth/session";
import { LOCATION_FRIDGE } from "../constants/storage";
import { useInventory } from "../lib/useInventory";
import "../App.css";
import "./CollectionPage.css";

function isFridgeItem(locationId?: string): boolean {
  return locationId === undefined || locationId === LOCATION_FRIDGE;
}

function galleryAmountText(item: InventoryItem): string {
  const cap = item.quantityCaption?.trim();
  if (cap) return cap;
  return `×${item.quantity}`;
}

function categoryLabel(item: InventoryItem): string {
  const c = item.category?.trim();
  return c && c.length > 0 ? c : "未分類";
}

export default function CollectionPage() {
  const navigate = useNavigate();
  const { items, loading, error } = useInventory();

  const fridgeItems = items.filter((i) => isFridgeItem(i.locationId));

  const onLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <header className="page-header">
        <div className="page-header__row">
          <div>
            <h1 className="page-title">冷蔵庫</h1>
            <p className="page-sub">ギャラリー</p>
          </div>
          <button
            type="button"
            className="btn-text"
            onClick={onLogout}
          >
            ログアウト
          </button>
        </div>
      </header>

      <main className="main main--flush">
        {error ? (
          <p className="banner banner-error">{error}</p>
        ) : null}

        {loading ? (
          <p className="muted page-pad">読み込み中…</p>
        ) : fridgeItems.length === 0 ? (
          <div className="page-pad empty-state card">
            <p className="muted empty-state__text">
              冷蔵庫の在庫はまだありません。
            </p>
            <Link to="/items/new" className="btn btn-primary empty-state__cta">
              商品を追加
            </Link>
          </div>
        ) : (
          <ul className="gallery-grid page-pad">
            {fridgeItems.map((item) => (
              <li key={item.id} className="gallery-grid__cell">
                <Link
                  className="gallery-card"
                  to={`/items/${item.id}`}
                >
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
                    <p
                      className={`gallery-card__category ${
                        item.category?.trim()
                          ? ""
                          : "gallery-card__category--muted"
                      }`}
                    >
                      {categoryLabel(item)}
                    </p>
                    <p className="gallery-card__name">{item.name}</p>
                    <p className="gallery-card__amount">
                      {galleryAmountText(item)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
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
