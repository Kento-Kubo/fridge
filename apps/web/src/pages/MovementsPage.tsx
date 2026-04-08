import { Link } from "react-router-dom";
import { formatDateJa } from "../lib/formatDate";
import { useInventory } from "../lib/useInventory";
import "../App.css";
import "./CollectionPage.css";

function movementLabel(type: "in" | "out"): string {
  return type === "in" ? "入庫" : "出庫";
}

export default function MovementsPage() {
  const { items, movements, loading, error } = useInventory();
  const nameMap = new Map(items.map((i) => [i.id, i.name] as const));

  return (
    <>
      <header className="page-header">
        <div className="page-header__row">
          <div>
            <h1 className="page-title">入出庫</h1>
            <p className="page-sub">履歴</p>
          </div>
        </div>
      </header>

      <main className="main main--flush page-pad">
        {error ? <p className="banner banner-error">{error}</p> : null}
        {loading ? (
          <p className="muted">読み込み中…</p>
        ) : movements.length === 0 ? (
          <div className="card">
            <p className="muted">まだ入出庫履歴がありません。</p>
          </div>
        ) : (
          <ul className="list card">
            {movements.map((m) => (
              <li key={m.id} className="list-item">
                <Link to={`/movements/${m.id}`} className="gallery-card">
                  <div className="gallery-card__body">
                    <p className="gallery-card__category">{movementLabel(m.type)}</p>
                    <p className="gallery-card__name">
                      {nameMap.get(m.itemId) ?? "削除された商品"}
                    </p>
                    <p className="gallery-card__amount">{`数量 ×${m.quantity}`}</p>
                    <p className="muted">{formatDateJa(m.occurredAt)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      {!loading && items.length > 0 ? (
        <Link to="/movements/new" className="fab" aria-label="入出庫を追加">
          <span className="fab__icon" aria-hidden>
            +
          </span>
        </Link>
      ) : null}
    </>
  );
}
