import type { TransactionRecord, TransactionRepository } from "@fridge-inventory/shared";

const STORAGE_KEY = "fridge-transactions-v1";

function readAll(): TransactionRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTransactionRecord);
  } catch {
    return [];
  }
}

function writeAll(records: TransactionRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function isTransactionRecord(x: unknown): x is TransactionRecord {
  if (x === null || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.itemName === "string" &&
    (o.type === "in" || o.type === "out") &&
    typeof o.quantity === "number" &&
    typeof o.recordedAt === "string"
  );
}

export function createLocalStorageTransactionRepository(): TransactionRepository {
  return {
    async list() {
      return readAll().sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
    },
    async add(input) {
      const id = input.id ?? `local-${crypto.randomUUID()}`;
      const record: TransactionRecord = {
        ...input,
        id,
        recordedAt: new Date().toISOString(),
      };
      const records = readAll();
      records.push(record);
      writeAll(records);
      return { ...record };
    },
  };
}
