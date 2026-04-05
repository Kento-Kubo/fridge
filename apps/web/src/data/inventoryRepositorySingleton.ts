import { createLocalStorageInventoryRepository } from "./localStorageInventoryRepository";

/** アプリ全体で共有する 1 インスタンス（localStorage 参照が一致するように） */
export const inventoryRepository = createLocalStorageInventoryRepository();
