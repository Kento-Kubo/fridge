import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { InventoryItem } from "@fridge-inventory/shared";
import { inventoryRepository } from "../data/inventoryRepositorySingleton";
import { InventoryContext } from "./inventoryContextBase";

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const list = await inventoryRepository.list();
      setItems(list);
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
        const list = await inventoryRepository.list();
        if (!cancelled) {
          setItems(list);
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
      loading,
      error,
      refresh,
      setError,
    }),
    [items, loading, error, refresh]
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}
