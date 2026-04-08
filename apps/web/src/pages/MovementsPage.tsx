import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatDateJa } from "../lib/formatDate";
import { useInventory } from "../lib/useInventory";
import "../App.css";
import "./CollectionPage.css";
import "./MovementsPage.css";

function movementLabel(type: "in" | "out"): string {
  return type === "in" ? "入庫" : "出庫";
}

export default function MovementsPage() {
  const { items, movements, loading, error } = useInventory();
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [filterItemId, setFilterItemId] = useState<string>("all");
  const nameMap = new Map(items.map((i) => [i.id, i.name] as const));
  const filterOptions = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name, "ja")),
    [items]
  );
  const visibleMovements = useMemo(() => {
    const list =
      filterItemId === "all"
        ? movements
        : movements.filter((m) => m.itemId === filterItemId);
    const sorted = [...list];
    sorted.sort((a, b) => {
      const diff =
        new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
      return sortOrder === "asc" ? diff : -diff;
    });
    return sorted;
  }, [movements, filterItemId, sortOrder]);

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

      <main className="main main--flush movements-main">
        {error ? <p className="banner banner-error">{error}</p> : null}

        <section className="card movements-controls page-pad">
          <label className="field">
            <span className="label">並び順</span>
            <select
              className="input"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
            >
              <option value="desc">入出庫日（新しい順）</option>
              <option value="asc">入出庫日（古い順）</option>
            </select>
          </label>
          <label className="field">
            <span className="label">製品フィルター</span>
            <select
              className="input"
              value={filterItemId}
              onChange={(e) => setFilterItemId(e.target.value)}
            >
              <option value="all">すべての製品</option>
              {filterOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </section>

        {loading ? (
          <p className="muted page-pad">読み込み中…</p>
        ) : visibleMovements.length === 0 ? (
          <div className="card page-pad">
            <p className="muted">まだ入出庫履歴がありません。</p>
          </div>
        ) : (
          <ul className="list card page-pad movements-list">
            {visibleMovements.map((m) => (
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
        <div className="movement-fab-group" aria-label="入出庫を追加">
          <Link to="/movements/new?type=out" className="fab fab--out" aria-label="出庫を追加">
            <span className="fab__icon" aria-hidden>
              -
            </span>
          </Link>
          <Link to="/movements/new?type=in" className="fab fab--in" aria-label="入庫を追加">
            <span className="fab__icon" aria-hidden>
              +
            </span>
          </Link>
        </div>
      ) : null}
    </>
  );
}
