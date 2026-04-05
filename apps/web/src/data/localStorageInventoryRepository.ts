import type { InventoryItem, InventoryRepository } from "@fridge-inventory/shared";
import { createInitialSeedItems } from "./seedInventoryItems";

const STORAGE_KEY = "fridge-inventory-items-v1";

function nowIso(): string {
  return new Date().toISOString();
}

function readAll(): InventoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    /** キー未作成＝このブラウザでは初回。デモ用シードを保存して返す */
    if (raw === null) {
      const seeds = createInitialSeedItems();
      writeAll(seeds);
      return seeds;
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isInventoryItem);
  } catch {
    return [];
  }
}

function writeAll(items: InventoryItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function isInventoryItem(x: unknown): x is InventoryItem {
  if (x === null || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (
    typeof o.id !== "string" ||
    typeof o.name !== "string" ||
    typeof o.quantity !== "number" ||
    typeof o.updatedAt !== "string" ||
    typeof o.source !== "string"
  ) {
    return false;
  }
  if (o.householdId !== undefined && typeof o.householdId !== "string") {
    return false;
  }
  if (o.locationId !== undefined && typeof o.locationId !== "string") {
    return false;
  }
  if (o.category !== undefined && typeof o.category !== "string") {
    return false;
  }
  if (o.imageUrl !== undefined && typeof o.imageUrl !== "string") {
    return false;
  }
  if (o.quantityCaption !== undefined && typeof o.quantityCaption !== "string") {
    return false;
  }
  return true;
}

export function createLocalStorageInventoryRepository(): InventoryRepository {
  return {
    async list() {
      return readAll().sort((a, b) => a.name.localeCompare(b.name, "ja"));
    },
    async upsert(input) {
      const id = input.id ?? `local-${crypto.randomUUID()}`;
      const row: InventoryItem = {
        ...input,
        id,
        updatedAt: nowIso(),
        source: input.source ?? "manual",
      };
      const items = readAll().filter((i) => i.id !== id);
      items.push(row);
      writeAll(items);
      return { ...row };
    },
    async remove(id) {
      writeAll(readAll().filter((i) => i.id !== id));
    },
  };
}
