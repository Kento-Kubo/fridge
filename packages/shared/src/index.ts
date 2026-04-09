/**
 * 在庫1行。スプレッドシートの列や API の JSON と対応させる。
 */
export type InventorySource = "manual" | "spreadsheet" | "camera" | "inferred";
export type MovementType = "in" | "out";

export interface InventoryItem {
  id: string;
  /** 世帯。未設定の既存データは後方互換で解釈側で補う */
  householdId?: string;
  /** 保管場所（例: fridge, freezer, pantry） */
  locationId?: string;
  /** カテゴリ（例: 野菜、飲料） */
  category?: string;
  /** 商品画像の URL（任意） */
  imageUrl?: string;
  /** 在庫切れでも表示を維持するルーティーン管理品かどうか */
  isRoutine?: boolean;
  name: string;
  quantity: number;
  /**
   * ギャラリー等で数量の代わりに見せる定性テキスト（例: 残りちょっと）。
   * 未設定時は ×quantity を表示する。
   */
  quantityCaption?: string;
  /** ISO 8601 日付文字列（例: 2026-04-10） */
  expiresAt?: string;
  note?: string;
  updatedAt: string;
  source: InventorySource;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: MovementType;
  quantity: number;
  /** ISO 8601 日付文字列（例: 2026-04-10） */
  expiresAt?: string;
  note?: string;
  /** ISO 8601 日時文字列（例: 2026-04-09T08:00:00.000Z） */
  occurredAt: string;
  updatedAt: string;
}

export interface InventoryRepository {
  list(): Promise<InventoryItem[]>;
  upsert(item: Omit<InventoryItem, "id" | "updatedAt"> & { id?: string }): Promise<InventoryItem>;
  remove(id: string): Promise<void>;
  listMovements(): Promise<InventoryMovement[]>;
  upsertMovement(
    movement: Omit<InventoryMovement, "id" | "updatedAt"> & { id?: string }
  ): Promise<InventoryMovement>;
  removeMovement(id: string): Promise<void>;
}

/**
 * 入出庫種別: "in" = 入庫（冷蔵庫への入庫）, "out" = 出庫（冷蔵庫からの使用）
 */
export type TransactionType = "in" | "out";

/**
 * 入出庫レコード1行。スプレッドシートの列や API の JSON と対応させる。
 */
export interface TransactionRecord {
  id: string;
  householdId?: string;
  /** 対応する在庫アイテム ID（任意） */
  itemId?: string;
  /** 取引時点の商品名 */
  itemName: string;
  type: TransactionType;
  quantity: number;
  note?: string;
  /** ISO 8601 タイムスタンプ */
  recordedAt: string;
}

export interface TransactionRepository {
  list(): Promise<TransactionRecord[]>;
  add(record: Omit<TransactionRecord, "id" | "recordedAt"> & { id?: string }): Promise<TransactionRecord>;
}
