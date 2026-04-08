import type {
  InventoryItem,
  InventoryMovement,
  InventoryRepository,
} from "@fridge-inventory/shared";
import { createInitialSeedItems } from "./seedInventoryItems";

const STORAGE_KEY = "fridge-inventory-items-v1";
const MOVEMENTS_STORAGE_KEY = "fridge-inventory-movements-v1";

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

function readMovements(): InventoryMovement[] {
  try {
    const raw = localStorage.getItem(MOVEMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isInventoryMovement);
  } catch {
    return [];
  }
}

function writeAll(items: InventoryItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function writeMovements(items: InventoryMovement[]): void {
  localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(items));
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

function isInventoryMovement(x: unknown): x is InventoryMovement {
  if (x === null || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (
    typeof o.id !== "string" ||
    typeof o.itemId !== "string" ||
    (o.type !== "in" && o.type !== "out") ||
    typeof o.quantity !== "number" ||
    typeof o.occurredAt !== "string" ||
    typeof o.updatedAt !== "string"
  ) {
    return false;
  }
  if (o.note !== undefined && typeof o.note !== "string") return false;
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
      writeMovements(readMovements().filter((m) => m.itemId !== id));
    },
    async listMovements() {
      return readMovements().sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      );
    },
    async upsertMovement(input) {
      const id = input.id ?? `mv-${crypto.randomUUID()}`;
      const row: InventoryMovement = {
        ...input,
        id,
        updatedAt: nowIso(),
      };
      const items = readMovements().filter((m) => m.id !== id);
      items.push(row);
      writeMovements(items);
      return { ...row };
    },
    async removeMovement(id) {
      writeMovements(readMovements().filter((m) => m.id !== id));
    },
  };
}
