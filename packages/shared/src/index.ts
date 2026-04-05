/**
 * 在庫1行。スプレッドシートの列や API の JSON と対応させる。
 */
export type InventorySource = "manual" | "spreadsheet" | "camera" | "inferred";

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

export interface InventoryRepository {
  list(): Promise<InventoryItem[]>;
  upsert(item: Omit<InventoryItem, "id" | "updatedAt"> & { id?: string }): Promise<InventoryItem>;
  remove(id: string): Promise<void>;
}
