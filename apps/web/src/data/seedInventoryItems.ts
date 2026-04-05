import type { InventoryItem } from "@fridge-inventory/shared";
import { LOCATION_FRIDGE } from "../constants/storage";

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * 初回起動時（localStorage にキーが無いとき）だけ投入するデモ用データ。
 */
export function createInitialSeedItems(): InventoryItem[] {
  const t = nowIso();
  const base = {
    updatedAt: t,
    source: "manual" as const,
    locationId: LOCATION_FRIDGE,
  };

  return [
    {
      ...base,
      id: "seed-natto",
      name: "納豆",
      category: "大豆加工品",
      quantity: 2,
    },
    {
      ...base,
      id: "seed-yogurt",
      name: "ヨーグルト",
      category: "乳製品",
      quantity: 4,
    },
    {
      ...base,
      id: "seed-ham",
      name: "ハム",
      category: "肉加工品",
      quantity: 1,
      quantityCaption: "残り半分くらい",
    },
    {
      ...base,
      id: "seed-melt-cheese",
      name: "とろけるチーズ",
      category: "乳製品",
      quantity: 1,
    },
    {
      ...base,
      id: "seed-strawberry",
      name: "いちご",
      category: "果物",
      quantity: 1,
      quantityCaption: "残りちょっと",
    },
    {
      ...base,
      id: "seed-baby-cheese",
      name: "1歳児用チーズ",
      category: "乳製品",
      quantity: 6,
    },
    {
      ...base,
      id: "seed-tofu",
      name: "豆腐",
      category: "大豆加工品",
      quantity: 1,
      quantityCaption: "1/2丁くらい",
    },
    {
      ...base,
      id: "seed-r1",
      name: "R-1",
      category: "乳製品",
      quantity: 3,
    },
  ];
}
