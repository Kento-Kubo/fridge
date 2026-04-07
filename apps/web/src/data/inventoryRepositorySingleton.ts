import { createLocalStorageInventoryRepository } from "./localStorageInventoryRepository";
import { createSheetsInventoryRepository } from "./sheetsInventoryRepository";

/**
 * VITE_SHEETS_API_URL が設定されている場合は Google スプレッドシートを使用し、
 * 未設定の場合は localStorage にフォールバックする。
 */
const sheetsApiUrl = import.meta.env.VITE_SHEETS_API_URL as string | undefined;

export const inventoryRepository = sheetsApiUrl
  ? createSheetsInventoryRepository(sheetsApiUrl)
  : createLocalStorageInventoryRepository();
