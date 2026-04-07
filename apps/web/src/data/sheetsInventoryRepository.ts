/**
 * Google スプレッドシートをバックエンドとする InventoryRepository。
 * Apps Script Web App の URL を apiUrl に渡して使用する。
 *
 * CORS プリフライトを避けるため fetch の Content-Type は設定しない
 * (body は JSON 文字列だが Apps Script は text/plain として受け取る)。
 */
import type { InventoryItem, InventoryRepository } from "@fridge-inventory/shared";

function nowIso(): string {
  return new Date().toISOString();
}

function isInventoryItem(x: unknown): x is InventoryItem {
  if (x === null || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.quantity === "number" &&
    typeof o.updatedAt === "string" &&
    typeof o.source === "string"
  );
}

async function postAction(apiUrl: string, body: unknown): Promise<unknown> {
  // Content-Type ヘッダーを省略することで simple request になり
  // CORS プリフライト (OPTIONS) が発生しない
  const res = await fetch(apiUrl, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Sheets API エラー: ${res.status}`);
  }
  return res.json();
}

export function createSheetsInventoryRepository(apiUrl: string): InventoryRepository {
  return {
    async list() {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`Sheets API エラー: ${res.status}`);
      const raw = (await res.json()) as unknown[];
      return raw
        .filter(isInventoryItem)
        .sort((a, b) => a.name.localeCompare(b.name, "ja"));
    },

    async upsert(input) {
      const id = input.id ?? `sheet-${crypto.randomUUID()}`;
      const item: InventoryItem = {
        ...input,
        id,
        updatedAt: nowIso(),
        source: input.source ?? "manual",
      };
      const result = (await postAction(apiUrl, { action: "upsert", item })) as InventoryItem;
      // Apps Script から返ってきた値が有効なら使い、そうでなければ送った値を返す
      return isInventoryItem(result) ? result : item;
    },

    async remove(id) {
      await postAction(apiUrl, { action: "remove", id });
    },
  };
}

/**
 * 画像ファイルを Google Drive にアップロードして URL を返す。
 * InventoryRepository の外側で使うユーティリティ関数。
 */
export async function uploadImageToDrive(
  apiUrl: string,
  file: File
): Promise<string> {
  // File を Base64 に変換
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // "data:image/jpeg;base64,XXXXX" の XXXXX 部分だけ取り出す
      const base64Data = result.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const body = {
    action: "uploadImage",
    base64,
    filename: file.name,
    mimeType: file.type || "image/jpeg",
  };

  const result = (await postAction(apiUrl, body)) as { url?: string; error?: string };
  if (!result.url) {
    throw new Error(result.error ?? "画像アップロードに失敗しました");
  }
  return result.url;
}
