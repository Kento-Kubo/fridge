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
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Sheets API エラー: ${res.status}`);
  }
  return res.json();
}

export function createSheetsInventoryRepository(apiUrl: string): InventoryRepository {
  return {
    async list() {
      const res = await fetch(apiUrl, { redirect: "follow" });
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
      return isInventoryItem(result) ? result : item;
    },

    async remove(id) {
      await postAction(apiUrl, { action: "remove", id });
    },
  };
}

/**
 * 画像を Canvas でリサイズ・圧縮して base64 (JPEG) を返す。
 * 大きな画像ファイルをそのまま送ると Apps Script がタイムアウトするため
 * 最大 1024px / quality 0.82 に縮小する。
 */
async function resizeToBase64(file: File, maxPx = 1024, quality = 0.82): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas 取得失敗")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const base64 = dataUrl.split(",")[1];
      resolve({ base64, mimeType: "image/jpeg" });
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("画像の読み込みに失敗しました")); };
    img.src = objectUrl;
  });
}

/**
 * 画像ファイルをリサイズして Google Drive にアップロードし URL を返す。
 * InventoryRepository の外側で使うユーティリティ関数。
 */
export async function uploadImageToDrive(
  apiUrl: string,
  file: File
): Promise<string> {
  const { base64, mimeType } = await resizeToBase64(file);

  const ext = mimeType === "image/jpeg" ? ".jpg" : ".png";
  const filename = file.name.replace(/\.[^.]+$/, "") + ext;

  const body = {
    action: "uploadImage",
    base64,
    filename,
    mimeType,
  };

  const result = (await postAction(apiUrl, body)) as { url?: string; error?: string };
  if (!result.url) {
    throw new Error(result.error ?? "画像アップロードに失敗しました");
  }
  return result.url;
}
