import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { TransactionRecord } from "@fridge-inventory/shared";
import { transactionRepository } from "../data/transactionRepositorySingleton";
import { TransactionContext } from "./transactionContextBase";

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const list = await transactionRepository.list();
      setRecords(list);
    } catch {
      setError("入出庫履歴の読み込みに失敗しました。");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await transactionRepository.list();
        if (!cancelled) setRecords(list);
      } catch {
        if (!cancelled) setError("入出庫履歴の読み込みに失敗しました。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const addRecord = useCallback(async (input: Omit<TransactionRecord, "id" | "recordedAt">) => {
    const created = await transactionRepository.add(input);
    setRecords((prev) => [created, ...prev]);
    return created;
  }, []);

  const value = useMemo(
    () => ({ records, loading, error, refresh, addRecord }),
    [records, loading, error, refresh, addRecord]
  );

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
}
