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

function toOptionalString(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v !== "string") return undefined;
  return v;
}

function normalizeInventoryItem(raw: unknown): InventoryItem | null {
  if (!isInventoryItem(raw)) return null;
  return {
    id: raw.id,
    name: raw.name,
    quantity: raw.quantity,
    updatedAt: raw.updatedAt,
    source: raw.source,
    householdId: toOptionalString(raw.householdId),
    locationId: toOptionalString(raw.locationId),
    category: toOptionalString(raw.category),
    imageUrl: toOptionalString(raw.imageUrl),
    quantityCaption: toOptionalString(raw.quantityCaption),
    expiresAt: toOptionalString(raw.expiresAt),
    note: toOptionalString(raw.note),
  };
}

async function postAction(apiUrl: string, body: unknown): Promise<unknown> {
  // Content-Type ヘッダーを省略することで simple request になり
  // CORS プリフライト (OPTIONS) が発生しない
  const res = await fetch(apiUrl, {
    method: "POST",
    body: JSON.stringify(body),
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Sheets API エラー: ${res.status}`);
  }
  const json = (await res.json()) as { error?: unknown };
  if (typeof json?.error === "string" && json.error.length > 0) {
    throw new Error(json.error);
  }
  return json;
}

export function createSheetsInventoryRepository(apiUrl: string): InventoryRepository {
  return {
    async list() {
      const res = await fetch(apiUrl, { redirect: "follow" });
      if (!res.ok) throw new Error(`Sheets API エラー: ${res.status}`);
      const raw = (await res.json()) as unknown;
      if (!Array.isArray(raw)) {
        throw new Error("Sheets API 形式エラー: 配列ではありません");
      }
      return raw
        .map(normalizeInventoryItem)
        .filter((x): x is InventoryItem => x !== null)
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
      const result = await postAction(apiUrl, { action: "upsert", item });
      return normalizeInventoryItem(result) ?? item;
    },

    async remove(id) {
      await postAction(apiUrl, { action: "remove", id });
    },
  };
}

/** Google スプレッドシート 1 セル上限に合わせた余裕付き（文字数は data URL 全体で数える） */
const MAX_STORED_IMAGE_URL_LENGTH = 48_000;

/**
 * 画像を Canvas で縮小・JPEG 圧縮し、シート保存用 data URL を返す。
 * GAS へ base64 を POST しない（POST サイズ制限・二重チェックのズレを避ける）。
 */
function compressImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 取得失敗"));
          return;
        }

        // 最初から小さめにしてループ回数を減らす
        let maxPx = 512;
        let w = Math.max(
          1,
          Math.round(
            img.width * Math.min(1, maxPx / Math.max(img.width, img.height))
          )
        );
        let h = Math.max(
          1,
          Math.round(
            img.height * Math.min(1, maxPx / Math.max(img.width, img.height))
          )
        );
        let q = 0.72;

        for (let i = 0; i < 28; i++) {
          canvas.width = w;
          canvas.height = h;
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          const dataUrl = canvas.toDataURL("image/jpeg", q);
          if (dataUrl.length <= MAX_STORED_IMAGE_URL_LENGTH) {
            resolve(dataUrl);
            return;
          }

          q = Math.max(0.12, q - 0.06);
          w = Math.max(1, Math.round(w * 0.72));
          h = Math.max(1, Math.round(h * 0.72));

          if (w <= 64 && h <= 64 && q <= 0.15) {
            break;
          }
        }

        reject(
          new Error(
            "画像をこれ以上小さくできませんでした。別の写真を選ぶか、トリミングしてからお試しください。"
          )
        );
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("画像の読み込みに失敗しました"));
    };
    img.src = objectUrl;
  });
}

/**
 * Sheets 連携時: 画像を圧縮した data URL を返す（GAS の uploadImage は呼ばない）。
 * apiUrl は既存呼び出し互換のため残す。
 */
export async function uploadImageToDrive(
  _apiUrl: string,
  file: File
): Promise<string> {
  void _apiUrl;
  return compressImageToDataUrl(file);
}
