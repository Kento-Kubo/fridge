/**
 * Google スプレッドシートをバックエンドとする TransactionRepository。
 * CORS プリフライトを避けるため Content-Type は設定しない。
 */
import type { TransactionRecord, TransactionRepository } from "@fridge-inventory/shared";

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

function toOptionalString(v: unknown): string | undefined {
  if (v === null || v === undefined || typeof v !== "string") return undefined;
  return v;
}

function normalizeRecord(raw: unknown): TransactionRecord | null {
  if (!isTransactionRecord(raw)) return null;
  return {
    id: raw.id,
    itemName: raw.itemName,
    type: raw.type,
    quantity: raw.quantity,
    recordedAt: raw.recordedAt,
    householdId: toOptionalString((raw as Record<string, unknown>).householdId),
    itemId: toOptionalString((raw as Record<string, unknown>).itemId),
    note: toOptionalString((raw as Record<string, unknown>).note),
  };
}

async function postAction(apiUrl: string, body: unknown): Promise<unknown> {
  const res = await fetch(apiUrl, {
    method: "POST",
    body: JSON.stringify(body),
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Sheets API エラー: ${res.status}`);
  const json = (await res.json()) as { error?: unknown };
  if (typeof json?.error === "string" && json.error.length > 0) {
    throw new Error(json.error);
  }
  return json;
}

export function createSheetsTransactionRepository(apiUrl: string): TransactionRepository {
  return {
    async list() {
      const res = await fetch(`${apiUrl}?resource=transactions`, { redirect: "follow" });
      if (!res.ok) throw new Error(`Sheets API エラー: ${res.status}`);
      const raw = (await res.json()) as unknown;
      if (!Array.isArray(raw)) throw new Error("Sheets API 形式エラー: 配列ではありません");
      return raw
        .map(normalizeRecord)
        .filter((x): x is TransactionRecord => x !== null);
    },

    async add(input) {
      const id = input.id ?? `sheet-${crypto.randomUUID()}`;
      const record: TransactionRecord = {
        ...input,
        id,
        recordedAt: new Date().toISOString(),
      };
      const result = await postAction(apiUrl, { action: "addTransaction", record });
      return normalizeRecord(result) ?? record;
    },
  };
}
