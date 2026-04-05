import { Link, useNavigate } from "react-router-dom";
import { clearSession } from "../auth/session";
import { LOCATION_FRIDGE } from "../constants/storage";
import { formatDateJa } from "../lib/formatDate";
import { useInventory } from "../lib/useInventory";
import "../App.css";
import "./CollectionPage.css";

function isFridgeItem(locationId?: string): boolean {
  return locationId === undefined || locationId === LOCATION_FRIDGE;
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
            <p className="page-sub">コレクション</p>
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
          <ul className="collection-list page-pad">
            {fridgeItems.map((item) => (
              <li key={item.id}>
                <Link className="collection-row card" to={`/items/${item.id}`}>
                  <div className="collection-row__main">
                    <span className="collection-row__name">{item.name}</span>
                    <span className="collection-row__qty">×{item.quantity}</span>
                  </div>
                  <div className="collection-row__meta">
                    期限 {formatDateJa(item.expiresAt)}
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
