import { createContext } from "react";
import type { InventoryItem } from "@fridge-inventory/shared";

export type InventoryContextValue = {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setError: (msg: string | null) => void;
};

export const InventoryContext = createContext<InventoryContextValue | null>(
  null
);
