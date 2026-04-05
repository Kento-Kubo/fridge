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
  name: string;
  quantity: number;
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
