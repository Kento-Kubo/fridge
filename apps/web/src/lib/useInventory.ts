import { useContext } from "react";
import { InventoryContext } from "./inventoryContextBase";
import type { InventoryContextValue } from "./inventoryContextBase";

export function useInventory(): InventoryContextValue {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error("useInventory must be used within InventoryProvider");
  }
  return ctx;
}
