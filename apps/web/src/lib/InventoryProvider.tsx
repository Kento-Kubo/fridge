import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { InventoryItem, InventoryMovement } from "@fridge-inventory/shared";
import { inventoryRepository } from "../data/inventoryRepositorySingleton";
import { InventoryContext } from "./inventoryContextBase";

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [itemList, movementList] = await Promise.all([
        inventoryRepository.list(),
        inventoryRepository.listMovements(),
      ]);
      setItems(itemList);
      setMovements(movementList);
    } catch {
      setError("在庫の読み込みに失敗しました。");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [itemList, movementList] = await Promise.all([
          inventoryRepository.list(),
          inventoryRepository.listMovements(),
        ]);
        if (!cancelled) {
          setItems(itemList);
          setMovements(movementList);
        }
      } catch {
        if (!cancelled) {
          setError("在庫の読み込みに失敗しました。");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      items,
      movements,
      loading,
      error,
      refresh,
      setError,
    }),
    [items, movements, loading, error, refresh]
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}
